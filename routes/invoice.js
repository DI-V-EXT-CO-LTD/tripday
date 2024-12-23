// routes/invoice.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Invoice = require('../models/inv');
const Voucher = require('../models/voucher');
const { getConnection, query } = require('../config/db');

function getRandomSplitAmount(min, max) {
  return Math.floor(Math.random() * (max - min + 1) / 10000) * 10000 + min;
}

async function generateUniqueVoucherCode() {
  let code;
  let exists = true;

  while (exists) {
    code = 'VCH-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    exists = await Voucher.exists({ voucherCode: code });
  }

  return code;
}

router.post('/', async (req, res) => {
  const { bookingcode: code } = req.body;
  let connection;

  try {
    connection = await getConnection();

    console.log('Booking code received:', code);

    const results = await query('SELECT * FROM bravo_bookings WHERE code = ?', [code]);

    console.log('Booking Results:', results);

    if (results.length > 0) {
      const booking = results[0];
      console.log('Looking for Booking ID: ', booking.id);

      const roomResults = await query('SELECT * FROM bravo_hotel_room_bookings WHERE booking_id = ?', [booking.id]);

      console.log('Room Results:', roomResults);

      // Extra price 가져오기
      const extraPriceResults = await query('SELECT val FROM bravo_booking_meta WHERE booking_id = ? AND name = ?', [booking.id, 'extra_price']);

      const extraPrices = extraPriceResults.map(result => result.val ? JSON.parse(result.val) : []).flat();
      console.log('Extra Prices:', extraPrices);

      // Extra prices total
      const extraPricesTotal = extraPrices.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);

      const roomIds = roomResults.map(room => room.room_id);

      if (roomIds.length > 0) {
        const roomsResults = await query('SELECT * FROM bravo_hotel_rooms WHERE id IN (?)', [roomIds]);

        const hotelNameParts = roomsResults.map(room => `${room.title} ${roomResults.find(r => r.room_id === room.id).number} rooms`);
        const parentIds = roomsResults.map(room => room.parent_id);

        const hotelResults = await query('SELECT * FROM bravo_hotels WHERE id IN (?)', [parentIds]);

        const hotelName = hotelResults.map(hotel => hotel.title).join(', ');

        const existingInvoices = await Invoice.find({ bookingCode: booking.code });

        if (existingInvoices.length > 0) {
          console.log('Existing invoices found, loading from DB');
          const existingBookings = existingInvoices.map(invoice => ({
            code: invoice.bookingCode,
            total: invoice.total,
            Hotel_Info: {
              hotelName: invoice.hotelName,
              RoomName: invoice.roomNames
            },
            invoiceNumber: invoice.invoiceNumber,
            transactionNo: invoice.transactionNo,
            totalTransactions: invoice.totalTransactions,
            extraPrices: invoice.extraPrices,
            extraPricesTotal: invoice.extraPricesTotal
          }));
          res.render('invoice', { bookings: existingBookings, extraPrices: extraPrices, extraPricesTotal: extraPricesTotal });
        } else {
          const voucherPromises = roomResults.map(async roomBooking => {
            const room = roomsResults.find(r => r.id === roomBooking.room_id);
            const voucherCode = await generateUniqueVoucherCode();
            const quantity = roomBooking.number * ((booking.end_date - booking.start_date) / (1000 * 60 * 60 * 24));
            const voucherData = {
              voucherCode: voucherCode,
              bookingCode: booking.code,
              roomId: room.id,
              roomTitle: room.title,
              quantity: quantity,
              initialQuantity: quantity,
              hotelName: hotelName,
              validFrom: booking.start_date,
              validUntil: booking.end_date,
              customer_first_name: booking.first_name,
              customer_last_name: booking.last_name,
              extraPricesTotal: extraPricesTotal
            };
            console.log('Creating Voucher with Data:', voucherData);
            return Voucher.create(voucherData);
          });

          await Promise.all(voucherPromises);

          const minAmount = 1000000; // 분할 최소 금액
          const maxAmount = 1450000; // 분할 최대 금액
          const subBookings = [];

          roomResults.forEach(roomBooking => {
            const room = roomsResults.find(r => r.id === roomBooking.room_id);
            let remainingTotal = roomBooking.price * roomBooking.number;

            while (remainingTotal > 0) {
              const subTotal = Math.min(remainingTotal, getRandomSplitAmount(minAmount, maxAmount));
              remainingTotal -= subTotal;

              subBookings.push({
                id: `${booking.id}-${subBookings.length + 1}`,
                code: booking.code,
                total: subTotal,
                Hotel_Info: {
                  hotelName: hotelName,
                  RoomName: [`${room.title} X ${roomBooking.number}`]
                }
              });
            }
          });

          console.log('SubBookings:', subBookings);

          const roomInvoices = subBookings.map((subBooking, index) => ({
            bookingCode: subBooking.code,
            invoiceId: subBooking.id,
            total: subBooking.total,
            hotelName: subBooking.Hotel_Info.hotelName,
            roomNames: subBooking.Hotel_Info.RoomName,
            transactionNo: index + 1,
            totalTransactions: subBookings.length,
            invoiceNumber: `${subBooking.code}-${index + 1}-${subBookings.length}`,
            extraPrices: extraPrices,
            extraPricesTotal: extraPricesTotal
          }));

          console.log("Room Invoices:", roomInvoices);

          try {
            await Invoice.insertMany(roomInvoices);
            console.log('MongoDB 저장 성공');
          } catch (mongoError) {
            console.error('MongoDB 저장 실패:', mongoError);
            res.status(500).send('MongoDB 저장 실패: ' + mongoError.message);
            return;
          }

          res.render('invoice', { bookings: subBookings, extraPrices: extraPrices, extraPricesTotal: extraPricesTotal });
        }
      } else {
        console.log('No room ids found');
        res.render('invoice', { bookings: [], extraPrices: [], extraPricesTotal: 0 });
      }
    } else {
      console.log('No booking results found');
      res.status(404).send('데이터 없음');
    }
  } catch (error) {
    console.error('서버 오류:', error);
    res.status(500).send('서버 오류: ' + error.message);
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;

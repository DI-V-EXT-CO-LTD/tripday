// routes/vouchers.js
const express = require('express');
const router = express.Router();
const Voucher = require('../models/voucher');
const Reservation = require('../models/reservation');
const pool = require('../config/db'); // MySQL 연결 풀 가져오기

async function generateUniqueVoucherCode() {
  let code;
  let exists = true;

  while (exists) {
    code = 'VCH-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    exists = await Voucher.exists({ voucherCode: code });
  }

  return code;
}

async function generateUniqueReservationCode() {
  let code;
  let exists = true;

  while (exists) {
    code = 'RES-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    exists = await Reservation.exists({ reservationCode: code });
  }

  return code;
}

router.post('/', async (req, res) => {
  const { bookingcode: code } = req.body;
  let connection;

  try {
    connection = await new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    const vouchers = await Voucher.find({ bookingCode: code });

    if (vouchers.length === 0) {
      const [results] = await new Promise((resolve, reject) => {
        const query = 'SELECT * FROM bravo_bookings WHERE code = ?';
        connection.query(query, [code], (error, results) => {
          if (error) reject(error);
          else resolve([results]);
        });
      });

      if (results.length > 0) {
        const booking = results[0];
        const [roomResults] = await new Promise((resolve, reject) => {
          const roomBookingsQuery = 'SELECT * FROM bravo_hotel_room_bookings WHERE booking_id = ?';
          connection.query(roomBookingsQuery, [booking.id], (roomError, roomResults) => {
            if (roomError) reject(roomError);
            else resolve([roomResults]);
          });
        });

        const [extraPriceResults] = await new Promise((resolve, reject) => {
          const extraPriceQuery = 'SELECT val FROM bravo_booking_meta WHERE booking_id = ? AND name = ?';
          connection.query(extraPriceQuery, [booking.id, 'extra_price'], (extraPriceError, extraPriceResults) => {
            if (extraPriceError) reject(extraPriceError);
            else resolve([extraPriceResults]);
          });
        });

        const extraPrices = extraPriceResults.map(result => result.val ? JSON.parse(result.val) : []).flat();
        const extraPricesTotal = extraPrices.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);

        const voucherPromises = roomResults.map(async roomBooking => {
          const room = roomResults.find(r => r.room_id === roomBooking.room_id);
          const voucherCode = await generateUniqueVoucherCode();
          const quantity = roomBooking.number * ((booking.end_date - booking.start_date) / (1000 * 60 * 60 * 24));
          const voucherData = {
            voucherCode: voucherCode,
            bookingCode: booking.code,
            roomId: room.room_id,
            roomTitle: room.title,
            quantity: quantity,
            initialQuantity: quantity,
            hotelName: room.title,
            validFrom: booking.start_date,
            validUntil: booking.end_date,
            customer_first_name: booking.first_name,
            customer_last_name: booking.last_name,
            extraPrices: extraPrices,
            extraPricesTotal: extraPricesTotal
          };
          return Voucher.create(voucherData);
        });

        await Promise.all(voucherPromises);
      }
    }

    const updatedVouchers = await Voucher.find({ bookingCode: code });
    const extraPrices = updatedVouchers[0]?.extraPrices || [];
    const extraPricesTotal = updatedVouchers[0]?.extraPricesTotal || 0;

    res.render('vouchers', {
      vouchers: updatedVouchers,
      hotelName: updatedVouchers[0].hotelName,
      bookingCode: code,
      extraPrices: extraPrices,
      extraPricesTotal: extraPricesTotal
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).send('Server error: ' + error.message);
  } finally {
    if (connection) connection.release();
  }
});

router.get('/history/:voucherCode', async (req, res) => {
  const voucherCode = req.params.voucherCode;
  try {
    const reservations = await Reservation.find({ voucherCode });

    if (reservations.length === 0) {
      return res.status(404).send('No reservations found for this voucher code');
    }

    res.render('history', { reservations, voucherCode });
  } catch (error) {
    console.error('Error fetching reservation history:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

module.exports = router;

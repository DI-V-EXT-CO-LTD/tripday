// ... (이전 코드 유지)
//adminController.js
const User = require('../models/user');
const Voucher = require('../models/voucher');
const Invoice = require('../models/inv');
const Hotel = require('../models/hotel');
const Room = require('../models/room');
const Booking = require('../models/Booking');
const Wallet = require('../models/wallet');
const Reservation = require('../models/reservation');
const Purchase = require('../models/purchase');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mailgunConfig = require('../config/mailgun');
const mailgun = require('mailgun-js')(mailgunConfig);
const ConsolidatedInvoice = require('../models/consolidatedInvoice');
const Golf = require('../models/golf');
const EmailLog = require('../models/emailLog');
const bcrypt = require('bcrypt');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELGRAM_BOT_TOKEN, {polling: false});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

exports.getDashboard = async (req, res) => {
    try {
      const users = await User.find();
      const wallet = await Wallet.find();
      const vouchers = await Voucher.find();
      const reservations = await Reservation.find();
      const purchases = await Purchase.find();
      const invoices = await Invoice.find({ userId: { $ne: "" } });
      const hotels = await Hotel.find();    
      const bookings = await Booking.find();  // Booking 데이터를 조회하는 코드
      const userCount = await User.countDocuments();
  
      // Fetch current purchases (with "Paid" status)
      const currentPurchases = await Purchase.find({ status: 'Pending' })
        .sort({ createdAt: -1 })
        .limit(10);  // Limit to 10 most recent purchases
  
      // Fetch pending invoices
      const pendingInvoices = await Invoice.find({ status: 'Pending' })
        .sort({ createdAt: -1 })
        .limit(10);  // Limit to 10 most recent pending invoices
  
      // Fetch golf courses for Golf Courses Management section
      const golfCourses = await Golf.find()
        .select('title price status course_info.holes course_info.par')
        .sort({ createdAt: -1 })
        .limit(10);  // Limit to 10 most recent golf courses
  
      // dashboard.ejs로 데이터 전달
      res.render('admin/dashboard', {
        admin: req.user,
        users,
        wallet,
        vouchers,
        reservations,
        purchases,
        invoices,
        hotels,
        bookings,  // 조회된 booking 데이터를 추가로 전달
        currentPurchases,
        pendingInvoices,
        golfCourses,  // Add this line
        userCount,
        pageTitle: 'Admin Dashboard'
      });
    } catch (error) {
      console.error('Error in getDashboard:', error);
      res.status(500).send('An error occurred while loading the dashboard');
    }
  };

exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalHotels = await User.countDocuments();
        const totalPages = Math.ceil(totalHotels / limit);

        // Calculate the range of page numbers to display
        const pageRange = 5; // Number of page links to show
        let startPage = Math.max(1, page - Math.floor(pageRange / 2));
        let endPage = Math.min(totalPages, startPage + pageRange - 1);

        // Adjust the start page if we're near the end
        if (endPage - startPage + 1 < pageRange) {
            startPage = Math.max(1, endPage - pageRange + 1);
        }

        const users = await User.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        res.render('admin/users', { 
          pageTitle: 'User Management', 
          users: users,
          currentPage: page,
          totalPages: totalPages,
          startPage: startPage,
          endPage: endPage,
      });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error loading users');
    }
};

exports.getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.render('admin/bookings', { pageTitle: 'Booking Management', bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).send('Error loading bookings');
    }
};

exports.getHotels = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalHotels = await Hotel.countDocuments();
        const totalPages = Math.ceil(totalHotels / limit);

        // Calculate the range of page numbers to display
        const pageRange = 5; // Number of page links to show
        let startPage = Math.max(1, page - Math.floor(pageRange / 2));
        let endPage = Math.min(totalPages, startPage + pageRange - 1);

        // Adjust the start page if we're near the end
        if (endPage - startPage + 1 < pageRange) {
            startPage = Math.max(1, endPage - pageRange + 1);
        }

        const hotels = await Hotel.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

        res.render('admin/hotels', {
            hotels: hotels,
            currentPage: page,
            totalPages: totalPages,
            startPage: startPage,
            endPage: endPage,
            pageTitle: 'Hotels Management'
        });
    } catch (error) {
        console.error('Error fetching hotels:', error);
        res.status(500).send('Error loading hotels');
    }
};

exports.getVouchers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const totlaVouchers = await Voucher.countDocuments();
  const totalPages = Math.ceil(totlaVouchers / limit);

  // Calculate the range of page numbers to display
  const pageRange = 5; // Number of page links to show
  let startPage = Math.max(1, page - Math.floor(pageRange / 2));
  let endPage = Math.min(totalPages, startPage + pageRange - 1);

  // Adjust the start page if we're near the end
  if (endPage - startPage + 1 < pageRange) {
      startPage = Math.max(1, endPage - pageRange + 1);
  }

    const vouchers = await Voucher.find().skip(skip).limit(limit);

    res.render('admin/adminVouchers', { 
      vouchers: vouchers,
      currentPage: page,
      totalPages: totalPages,
      startPage: startPage,
      endPage: endPage,
      pageTitle: 'Vouchers Management'  // 페이지 타이틀 추가
    });
};

exports.getInvoices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Number of invoices per page
        const skip = (page - 1) * limit;

        const totalInvoices = await Invoice.countDocuments();
        const totalPages = Math.ceil(totalInvoices / limit);

        // const invoices = await Invoice.find({ userId: { $ne: "" } })
        const invoices = await Invoice.find({ userId: { $ne: "" } })
            .skip(skip)
            .limit(limit)
            .populate('user', 'email')
            .populate('reservation', 'bookingCode hotelName');

        res.render('admin/invoices', { 
            pageTitle: 'Invoice Management', 
            invoices,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).send('Error loading invoices');
    }
};

exports.getCustomerService = (req, res) => {
    res.render('admin/customerService', { pageTitle: 'Customer Service' });
};

exports.getNotices = (req, res) => {
    res.render('admin/notices', { pageTitle: 'Notices Management' });
};

exports.getSales = (req, res) => {
    res.render('admin/sales', { pageTitle: 'Sales Management' });
};

exports.getHotelList = async (req, res) => {
    try {
        const hotels = await Hotel.find();
        res.render('admin/hotelList', { pageTitle: 'Hotel List', hotels });
    } catch (error) {
        console.error('Error fetching hotel list:', error);
        res.status(500).send('Error loading hotel list');
    }
};

exports.getHotelRegistrationForm = (req, res) => {
    res.render('admin/hotelRegistration', { pageTitle: 'Hotel Registration' });
};

exports.registerHotel = async (req, res) => {
    try {
        const newHotel = new Hotel(req.body);
        await newHotel.save();
        res.redirect('/admin/hotels');
    } catch (error) {
        console.error('Error registering hotel:', error);
        res.status(500).send('Error registering hotel');
    }
};

exports.getAddHotelForm = (req, res) => {
    res.render('admin/addHotel', { pageTitle: 'Add New Hotel' });
};

exports.addHotel = async (req, res) => {
    try {
        const hotelData = req.body;
        
        // Handle file uploads
        if (req.files) {
            if (req.files.image) {
                hotelData.image_id = req.files.image[0].filename;
            }
            if (req.files.banner_image) {
                hotelData.banner_image_id = req.files.banner_image[0].filename;
            }
            if (req.files.gallery) {
                hotelData.gallery = req.files.gallery.map(file => file.filename);
            }
        }

        const newHotel = new Hotel(hotelData);
        await newHotel.save();
        res.redirect('/admin/hotels');
    } catch (error) {
        console.error('Error adding hotel:', error);
        res.status(500).send('Error adding hotel');
    }
};

exports.manageRooms = async (req, res) => {
    try {
        const hotelId = req.params.id;
        const hotel = await Hotel.findById(hotelId).populate({
            path: 'rooms',
            select: 'number title price beds size adults children status amenities view bed_type max_occupancy is_breakfast_included is_refundable cancellation_policy'
        });
        if (!hotel) {
            return res.status(404).send('Hotel not found');
        }
        res.render('admin/room-management', { 
            pageTitle: 'Manage Rooms', 
            hotel: hotel,
            rooms: hotel.rooms,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching hotel rooms:', error);
        res.status(500).send('Error loading hotel rooms');
    }
};

exports.getAddRoomForm = async (req, res) => {
    try {
        const hotelId = req.params.id;
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).send('Hotel not found');
        }
        res.render('admin/add-room', { 
            pageTitle: 'Add New Room', 
            hotel: hotel
        });
    } catch (error) {
        console.error('Error loading add room form:', error);
        res.status(500).send('Error loading add room form');
    }
};

exports.addRoom = async (req, res) => {
    try {
        const hotelId = req.params.id;
        const roomData = req.body;
        roomData.hotel = hotelId;

        // Handle file uploads
        if (req.files && req.files.images) {
            roomData.images = req.files.images.map(file => file.filename);
        }

        const newRoom = new Room(roomData);
        await newRoom.save();

        // Add the room to the hotel's rooms array
        await Hotel.findByIdAndUpdate(hotelId, { $push: { rooms: newRoom._id } });

        res.redirect(`/admin/hotels/${hotelId}/manage-rooms`);
    } catch (error) {
        console.error('Error adding room:', error);
        res.status(500).send('Error adding room');
    }
};

exports.getEditRoomForm = async (req, res) => {
    try {
        const { hotelId, roomId } = req.params;
        const hotel = await Hotel.findById(hotelId);
        const room = await Room.findById(roomId);
        if (!hotel || !room) {
            return res.status(404).send('Hotel or Room not found');
        }
        res.render('admin/editRoom', { 
            pageTitle: 'Edit Room', 
            hotel: hotel,
            room: room
        });
    } catch (error) {
        console.error('Error loading edit room form:', error);
        res.status(500).send('Error loading edit room form');
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const { hotelId, roomId } = req.params;
        const roomData = req.body;

        // Handle file uploads
        if (req.files && req.files.images) {
            roomData.images = req.files.images.map(file => file.filename);
        }

        await Room.findByIdAndUpdate(roomId, roomData);
        res.redirect(`/admin/hotels/${hotelId}/manage-rooms`);
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).send('Error updating room');
    }
};

// New functions for bulk hotel upload
exports.getBulkHotelUploadForm = (req, res) => {
    res.render('admin/bulkHotelUpload', { pageTitle: 'Bulk Hotel Upload' });
};

exports.processBulkHotelUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const row of data) {
            try {
                const hotel = new Hotel(row);
                await hotel.save();
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push(`Error adding hotel ${row.title}: ${error.message}`);
            }
        }

        // Delete the uploaded file
        fs.unlinkSync(req.file.path);

        res.render('admin/bulkUploadResults', { 
            pageTitle: 'Bulk Upload Results', 
            results: results 
        });
    } catch (error) {
        console.error('Error processing bulk hotel upload:', error);
        res.status(500).send('Error processing bulk hotel upload');
    }
};

// New functions for hotel details, edit, rooms, and delete
exports.getHotelDetails = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).send('Hotel not found');
        }
        res.render('admin/hotel-details', { hotel, pageTitle: 'Hotel Details' });
    } catch (error) {
        console.error('Error fetching hotel details:', error);
        res.status(500).send('Error loading hotel details');
    }
};

exports.getEditHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).send('Hotel not found');
        }
        res.render('admin/hotel-edit', { hotel, pageTitle: 'Edit Hotel' });
    } catch (error) {
        console.error('Error fetching hotel for edit:', error);
        res.status(500).send('Error loading hotel edit form');
    }
};

exports.postEditHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!hotel) {
            return res.status(404).send('Hotel not found');
        }
        res.redirect('/admin/hotels');
    } catch (error) {
        console.error('Error updating hotel:', error);
        res.status(500).send('Error updating hotel');
    }
};

exports.getHotelRooms = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id).populate('rooms');
        if (!hotel) {
            return res.status(404).send('Hotel not found');
        }
        res.render('admin/hotel-rooms', { hotel, pageTitle: 'Hotel Rooms' });
    } catch (error) {
        console.error('Error fetching hotel rooms:', error);
        res.status(500).send('Error loading hotel rooms');
    }
};

exports.deleteHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndDelete(req.params.id);
        if (!hotel) {
            return res.status(404).send('Hotel not found');
        }
        res.redirect('/admin/hotels');
    } catch (error) {
        console.error('Error deleting hotel:', error);
        res.status(500).send('Error deleting hotel');
    }
};

// New functions for adding a room
exports.getAddRoom = async (req, res) => {
    try {
        const hotelId = req.params.id;
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).send('Hotel not found');
        }
        res.render('admin/add-room', { hotel, pageTitle: 'Add New Room' });
    } catch (error) {
        console.error('Error loading add room form:', error);
        res.status(500).send('Error loading add room form');
    }
};


exports.postAddRoom = async (req, res) => {
    try {
        const hotelId = req.params.id;
        const roomData = req.body;
        roomData.parent_id = hotelId;

        if (req.files && req.files.room_images) {
            roomData.images = req.files.room_images.map(file => file.filename);
        }

        // Parse amenities from string to array
        if (roomData.amenities) {
            roomData.amenities = JSON.parse(roomData.amenities);
        }

        const newRoom = new Room(roomData);
        await newRoom.save();

        // Add the room to the hotel's rooms array
        await Hotel.findByIdAndUpdate(hotelId, { $push: { rooms: newRoom._id } });

        res.redirect(`/admin/hotels/${hotelId}/manage-rooms`);
    } catch (error) {
        console.error('Error adding room:', error);
        res.status(500).send('Error adding room');
    }
};


exports.createRoom = async (roomData) => {
    try {    
        // Validate required fields
        const requiredFields = ['title', 'content', 'images', 'price', 'hotel', 'number', 'beds', 'size', 'adults', 'children'];
        for (const field of requiredFields) {
            if (!roomData[field]) {
                console.error(`Missing required field: ${field}`);
                throw new Error(`Missing required field: ${field}`);
            }
        }

        const newRoom = new Room(roomData);
        
        const savedRoom = await newRoom.save();
        const updatedHotel = await Hotel.findByIdAndUpdate(
            roomData.hotel,
            { $push: { rooms: savedRoom._id } },
            { new: true }
        );
        
        if (!updatedHotel) {
            console.error(`Hotel with id ${roomData.hotel} not found`);
            throw new Error(`Hotel with id ${roomData.hotel} not found`);
        }
        
        return savedRoom;
    } catch (error) {
        if (error.name === 'ValidationError') {
            for (let field in error.errors) {
                console.error(`Validation error for field ${field}:`, error.errors[field].message);
            }
        }
        throw error;
    }
};

// New function to get purchases with pagination
exports.getPurchases = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Number of purchases per page
        const skip = (page - 1) * limit;

        const totalPurchases = await Purchase.countDocuments();
        const totalPages = Math.ceil(totalPurchases / limit);

        const purchases = await Purchase.find()
            .skip(skip)
            .limit(limit)
            .populate('user', 'email')
            .sort({ createdAt: -1 });

        res.json({
            purchases: purchases,
            currentPage: page,
            totalPages: totalPages,
            total: totalPurchases,
            perPage: limit
        });
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ error: 'Error loading purchases' });
    }
};

// New function to get current purchases (with "Paid" status)
exports.getCurrentPurchases = async (req, res) => {
    try {
        const currentPurchases = await Purchase.find({ status: 'Paid' })
            .populate('user', 'email')
            .sort({ createdAt: -1 })

        res.json({
            purchases: currentPurchases
        });
    } catch (error) {
        console.error('Error fetching current purchases:', error);
        res.status(500).json({ error: 'Error loading current purchases' });
    }
};

exports.acceptPaid = async (req, res) => {
    try {
        const pendingPurchases = await Purchase.find({ status: 'Pending' });

        if (pendingPurchases.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No pending purchases found'
            });
        }

        let totalAmount = 0;
        const purchaseDetails = [];

        // Create a consolidated invoice
        const consolidatedInvoice = new ConsolidatedInvoice({
            invoiceNumber: 'CINV-' + Date.now(),
            status: 'Pending',
            purchases: [],
            splitInvoices: []
        });

        for (const purchase of pendingPurchases) {
            totalAmount += purchase.amount * purchase.nights;

            purchaseDetails.push({
                purchaseId: purchase.purchaseId,
                hotelName: purchase.hotelName,
                roomName: purchase.roomName,
                amount: purchase.amount,
                nights: purchase.nights
            });

            // Update purchase status and add to consolidated invoice
            purchase.status = 'Paid';
            purchase.updatedAt = Date.now();
            purchase.invoice = consolidatedInvoice._id;
            
            // Check if purchaseLog exists, if not, create it
            if (!purchase.purchaseLog) {
                purchase.purchaseLog = [];
            }
            purchase.purchaseLog.push({ timestamp: Date.now(), message: 'Purchase marked as paid' });
            
            await purchase.save();

            consolidatedInvoice.purchases.push(purchase._id);

            // Send email notification to the user
            const userEmailSubject = `Your Purchase (${purchase.purchaseId}) Status Has Changed`;
            const userEmailContent = `
            Status Has Changed
            Thank you for your purchase. Here are the details:
            
                Hotel: ${purchase.hotelName}
                Room: ${purchase.roomName}
                Status: Paid
            `;
            const user = await User.findById(purchase.user);

            const data = {
                from: 'TRIP-DAY <contact@trip-day>',
                to: user.email,
                subject: userEmailSubject,
                text: userEmailContent,
            };

            mailgun.messages().send(data, (error, body) => {
                if (error) {
                    console.error('Error sending status Change email', error);
                } else {
                    console.log('Email sent successfully');
                }
            });

            const newEmailLog = new EmailLog({
                from: data.from,
                to: data.to,
                subject: data.subject,
                text: data.text,
              });
              await newEmailLog.save();
        }

        // Set the total amount for the consolidated invoice
        consolidatedInvoice.totalAmount = totalAmount;

        // Split the invoice based on the total amount
        const minAmount = 1000000; // 분할 최소 금액
        const maxAmount = 1450000; // 분할 최대 금액
        const splitInvoices = [];

        let remainingAmount = totalAmount;
        while (remainingAmount > 0) {
            const subTotal = Math.min(remainingAmount, getRandomSplitAmount(minAmount, maxAmount));
            remainingAmount -= subTotal;

            const splitInvoice = new Invoice({
                invoiceNumber: 'INV-' + Date.now() + '-' + splitInvoices.length,
                totalAmount: subTotal,
                status: 'Pending',
                date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
                consolidatedInvoice: consolidatedInvoice._id
            });

            // await splitInvoice.save();
            splitInvoices.push(splitInvoice);
            consolidatedInvoice.splitInvoices.push(splitInvoice._id);
        }

        // Save the consolidated invoice
        await consolidatedInvoice.save();

        // Return JSON response
        const response = {
            success: true,
            message: 'Purchases marked as paid and invoices generated successfully',
            invoiceId: consolidatedInvoice._id,
            data: {
                consolidatedInvoice: {
                    invoiceNumber: consolidatedInvoice.invoiceNumber,
                    totalAmount: consolidatedInvoice.totalAmount,
                    status: consolidatedInvoice.status
                },
                acceptedAmount: splitInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
                splitInvoices: splitInvoices.map(invoice => ({
                    invoiceNumber: invoice.invoiceNumber,
                    totalAmount: invoice.totalAmount,
                    status: invoice.status,
                    date: invoice.date
                })),
                purchaseDetails: purchaseDetails,
                totalPurchases: pendingPurchases.length
            }
        };
        res.json(response);
    } catch (error) {
        console.error('Error processing accept paid:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing the accept paid request: ' + error.message
        });
    }
};
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
  exports.updateInvoiceStatus = async (req, res) => {
    try {
      const { invoiceId, remittanceNumber, remittanceImage } = req.body;
      
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }
  
      invoice.status = 'Processing';
      invoice.remittanceNumber = remittanceNumber;
      invoice.remittanceImage = remittanceImage;
      await invoice.save();
  
      res.json({ success: true, message: 'Invoice status updated successfully' });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      res.status(500).json({ success: false, message: 'An error occurred while updating the invoice status' });
    }
  };
  exports.processRemittance = async (req, res) => {
    try {
      const { invoiceId, remittanceNumber } = req.body;
      
      const invoice = await Invoice.findOne({invoiceNumber: invoiceId}); 
        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }
        invoice.status = 'Processing';
        invoice.remittanceNumber = remittanceNumber;

        await invoice.save();
        res.json({ success: true, message: 'Remittance processed successfully' });
    }
    catch (error) {
        console.error('Error processing remittance:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing the remittance' });
    }
    };

    exports.getUserDetails = async (req, res) => {
        try {
            const userId = req.params.id;
            const user = await User.findOne({ email: userId });
            if (!user) {
                return res.status(404).send('User not found');
            }
            res.render('admin/userDetails', { 
                layout: false,
                pageTitle: 'User Details', 
                user: user
            });
        } catch (error) {
            console.error('Error fetching user details:', error);
            res.status(500).send('Error loading user details');
        }
    };
    // 기존 코드는 유지하고 아래 내용을 파일 끝에 추가합니다.



    exports.getGolfCourses = async (req, res) => {
      try {
          const page = parseInt(req.query.page) || 1;
          const limit = 10;
          const skip = (page - 1) * limit;
  
          const totalGolfCourses = await Golf.countDocuments();
          const totalPages = Math.ceil(totalGolfCourses / limit);
  
          const pageRange = 5;
          let startPage = Math.max(1, page - Math.floor(pageRange / 2));
          let endPage = Math.min(totalPages, startPage + pageRange - 1);
  
          if (endPage - startPage + 1 < pageRange) {
              startPage = Math.max(1, endPage - pageRange + 1);
          }
  
          const golfCourses = await Golf.find()
              .select('title price status course_info.holes course_info.par')
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit);
  
          res.render('admin/golfCourses', {
              golfCourses: golfCourses,
              currentPage: page,
              totalPages: totalPages,
              startPage: startPage,
              endPage: endPage,
              pageTitle: 'Golf Courses Management'
          });
      } catch (error) {
          console.error('Error fetching golf courses:', error);
          res.status(500).send('Error loading golf courses');
      }
  };

exports.getAddGolfCourseForm = (req, res) => {
    res.render('admin/addGolfCourse', { pageTitle: 'Add New Golf Course' });
};



exports.addGolfCourse = async (req, res) => {
  try {
      const golfCourseData = req.body;
      
      // Handle file uploads
      if (req.files) {
          if (req.files.image) {
              golfCourseData.image_id = req.files.image[0].filename;
          }
          if (req.files.banner_image) {
              golfCourseData.banner_image_id = req.files.banner_image[0].filename;
          }
          if (req.files.gallery) {
              golfCourseData.gallery = req.files.gallery.map(file => file.filename);
          }
      }

      // Convert checkbox values to boolean
      golfCourseData.is_featured = golfCourseData.is_featured === 'on';
      golfCourseData.allow_full_day = golfCourseData.allow_full_day === 'on';

      // Parse numeric values
      golfCourseData.price = parseFloat(golfCourseData.price);
      golfCourseData.sale_price = parseFloat(golfCourseData.sale_price) || undefined;

      // Set nameEn to title if not provided
      if (!golfCourseData.nameEn) {
          golfCourseData.nameEn = golfCourseData.title;
      }

      // Generate slug if not provided
      if (!golfCourseData.slug) {
          golfCourseData.slug = golfCourseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      }

      // Parse course info
      golfCourseData.course_info = {
          holes: parseInt(golfCourseData.course_info.holes),
          par: parseInt(golfCourseData.course_info.par)
      };

      const newGolfCourse = new Golf(golfCourseData);
      await newGolfCourse.save();
      res.redirect('/admin/dashboard');
  } catch (error) {
      console.error('Error adding golf course:', error);
      res.status(500).send('Error adding golf course');
  }
};

exports.postEditGolfCourse = async (req, res) => {
    try {
        const golfCourseData = req.body;

        // Handle file uploads
        if (req.files) {
            if (req.files.image) {
                golfCourseData.image_id = req.files.image[0].filename;
            }
            if (req.files.banner_image) {
                golfCourseData.banner_image_id = req.files.banner_image[0].filename;
            }
            if (req.files.gallery) {
                golfCourseData.gallery = req.files.gallery.map(file => file.filename);
            }
        }

        // Convert checkbox values to boolean
        golfCourseData.is_featured = golfCourseData.is_featured === 'on';
        golfCourseData.allow_full_day = golfCourseData.allow_full_day === 'on';

        // Parse numeric values
        golfCourseData.map_lat = parseFloat(golfCourseData.map_lat);
        golfCourseData.map_lng = parseFloat(golfCourseData.map_lng);
        golfCourseData.map_zoom = parseInt(golfCourseData.map_zoom);
        golfCourseData.price = parseFloat(golfCourseData.price);
        golfCourseData.sale_price = parseFloat(golfCourseData.sale_price) || undefined;

        // Parse course info
        golfCourseData.course_info = {
            holes: parseInt(golfCourseData.course_info.holes),
            par: parseInt(golfCourseData.course_info.par),
            length: parseInt(golfCourseData.course_info.length),
            course_type: golfCourseData.course_info.course_type
        };

        // Parse green fees
        golfCourseData.green_fee = {
            weekday: parseFloat(golfCourseData.green_fee.weekday),
            weekend: parseFloat(golfCourseData.green_fee.weekend)
        };

        const golfCourse = await Golf.findByIdAndUpdate(req.params.id, golfCourseData, { new: true });
        if (!golfCourse) {
            return res.status(404).send('Golf course not found');
        }
        res.redirect('/admin/golf-courses');
    } catch (error) {
        console.error('Error updating golf course:', error);
        res.status(500).send('Error updating golf course');
    }
};

exports.getGolfCourseDetails = async (req, res) => {
    try {
        const golfCourse = await Golf.findById(req.params.id);
        if (!golfCourse) {
            return res.status(404).send('Golf course not found');
        }
        res.render('admin/golf-course-details', { golfCourse, pageTitle: 'Golf Course Details' });
    } catch (error) {
        console.error('Error fetching golf course details:', error);
        res.status(500).send('Error loading golf course details');
    }
};

exports.getEditGolfCourse = async (req, res) => {
    try {
        const golfCourse = await Golf.findById(req.params.id);
        if (!golfCourse) {
            return res.status(404).send('Golf course not found');
        }
        res.render('admin/golf-course-edit', { golfCourse, pageTitle: 'Edit Golf Course' });
    } catch (error) {
        console.error('Error fetching golf course for edit:', error);
        res.status(500).send('Error loading golf course edit form');
    }
};

exports.deleteGolfCourse = async (req, res) => {
    try {
        const golfCourse = await Golf.findByIdAndDelete(req.params.id);
        if (!golfCourse) {
            return res.status(404).send('Golf course not found');
        }
        res.redirect('/admin/golf-courses');
    } catch (error) {
        console.error('Error deleting golf course:', error);
        res.status(500).send('Error deleting golf course');
    }
};
exports.getBooking = async (req, res) => {
    try {
      // 여기에 예약 데이터를 가져오는 로직을 구현합니다.
      // 예를 들어:
      // const bookings = await Booking.find().sort({ createdAt: -1 }).limit(10);
      res.render('admin/booking', { 
        pageTitle: 'Booking Management',
        bookings: [] // 실제 예약 데이터로 교체하세요
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).send('Error loading booking data');
    }
  };
exports.getMonthlyBookings = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const bookings = await Booking.find({
      useDate: { $gte: startDate, $lte: endDate }
    });

    const bookingsByDate = bookings.reduce((acc, booking) => {
      const date = booking.useDate.getDate();
      if (!acc[date]) {
        acc[date] = {
          bookingCount: 0,
          totalAmount: 0
        };
      }
      acc[date].bookingCount += 1;
      acc[date].totalAmount += booking.Amount;
      return acc;
    }, {});

    const result = Object.entries(bookingsByDate).map(([date, data]) => ({
      date: parseInt(date),
      bookingCount: data.bookingCount,
      totalAmount: data.totalAmount
    }));

    res.json(result);
  } catch (error) {
    console.error('예약 데이터 조회 중 오류 발생:', error);
    res.status(500).json({ error: '예약 데이터를 불러오는 중 오류가 발생했습니다.' });
  }
};
exports.changeUserPassword = async (req, res) => {
    console.log('Changing Password');
    const { email, newPassword } = req.body;

    let FindUser = await User.findOne({ email: email });
    if (!FindUser) {
        return res.status(404).json({ message: 'User not found' });
    }
    else{

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        FindUser.password = hashedPassword;
        await FindUser.save();
        bot.sendMessage(process.env.TELGRAM_CHAT_ID, `관리자님이 (${email})의 비밀번호를 변경하였습니다. 변경된 비밀번호는 ${newPassword} 입니다.`);
        return res.status(200).json({ message: 'Password changed successfully' });
    }
    // 실제 비밀번호 변경 로직은 여기에 구현될 것입니다.
  };

// ... (이후 코드 유지)
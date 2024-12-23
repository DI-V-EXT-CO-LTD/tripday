//adminRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const adminController = require('../controllers/adminController');
const splitInvoiceController = require('../controllers/splitInvoiceController');
const User = require('../models/user');
const Hotel = require('../models/hotel');
const Reservation = require('../models/reservation');
const Purchase = require('../models/purchase');
const Invoice = require('../models/inv');
const Voucher = require('../models/voucher');
const adminInvoiceController = require('../controllers/adminInvoiceController');

// Middleware to check if the user is an authenticated admin
const isAuthenticatedAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
        return next();
    }
    res.redirect('/'); // Redirect to login page if not authenticated or not an admin
};

// Apply the isAuthenticatedAdmin middleware to all admin routes
router.use(isAuthenticatedAdmin);

// Invoice routes
router.get('/invoices/:id', adminInvoiceController.getInvoice);

const remittanceUpload = multer({ dest: 'uploads/remittances/' });

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/uploads');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 12 // Max number of files
    }
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner_image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
    { name: 'room_images', maxCount: 10 } // New field for room images
]);

// Add new routes for processing remittances and uploading remittance pictures
router.post('/process-remittance', adminController.processRemittance);

router.get('/dashboard', adminController.getDashboard);

router.post('/accept-paid', adminController.acceptPaid);

router.get('/invoices', async (req, res) => {
    try {
        
        const page = parseInt(req.query.page) || 1;
        const limit = 20; // Number of invoices per page
        const skip = (page - 1) * limit;

        const totalInvoices = await Invoice.countDocuments();
        const totalPages = Math.ceil(totalInvoices / limit);

        const invoices = await Invoice.find({ userId: "togethertour7@gmail.com" }).skip(skip).limit(limit);

        
        res.render('admin/invoices', { 
            layout: false, // This ensures that only the invoices partial is rendered
            invoices: invoices,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).send('Error loading invoices');
    }
});

router.get('/booking', adminController.getBooking);
// 새로운 라우트 추가: 특정 월의 예약 데이터를 가져오는 API
router.get('/bookings', adminController.getMonthlyBookings);

// Route for fetching hotels data via AJAX

router.post('/hotels/data', adminController.getHotels);
router.get('/hotels', adminController.getHotels);
// New route for rendering the "Add Hotel" form
router.get('/hotels/add', (req, res) => {
    res.render('admin/addHotel', { 
        layout: false, // This ensures that only the addHotel partial is rendered
        pageTitle: 'Add New Hotel'
    });
});

// Updated route for handling the form submission to create a new hotel
router.post('/hotels/add', (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            req.flash('error', `File upload error: ${err.message}`);
            return res.redirect('/admin/dashboard');
        } else if (err) {
            console.error('Unknown error:', err);
            req.flash('error', `Unknown error: ${err.message}`);
            return res.redirect('/admin/dashboard');
        }

        try {
            const hotelData = {
                title: req.body.title,
                slug: req.body.slug,
                content: req.body.content,
                nameEn: req.body.nameEn,
                location_id: req.body.location_id,
                address: req.body.address,
                map_lat: parseFloat(req.body.map_lat),
                map_lng: parseFloat(req.body.map_lng),
                map_zoom: 14, // Always set to 14
                is_featured: req.body.is_featured === 'true',
                star_rate: parseInt(req.body.star_rate),
                price: parseFloat(req.body.price),
                check_in_time: req.body.check_in_time,
                check_out_time: req.body.check_out_time,
                allow_full_day: req.body.allow_full_day === 'true',
                sale_price: req.body.sale_price ? parseFloat(req.body.sale_price) : undefined,
                status: req.body.status
            };

            if (req.files.image) {
                hotelData.image_id = req.files.image[0].filename;
            }
            if (req.files.banner_image) {
                hotelData.banner_image_id = req.files.banner_image[0].filename;
            }
            if (req.files.gallery) {
                hotelData.gallery = req.files.gallery.map(file => file.filename);
            }

            const newHotel = new Hotel(hotelData);
            await newHotel.save();
            
            req.flash('success', 'Hotel added successfully');
            res.redirect('/admin/dashboard');
        } catch (error) {
            console.error('Error saving hotel:', error);
            req.flash('error', 'Error saving hotel: ' + error.message);
            res.redirect('/admin/dashboard');
        }
    });
});

// New routes for hotel details, edit, rooms, and delete
router.get('/hotels/:id/details', adminController.getHotelDetails);
router.get('/hotels/:id/edit', adminController.getEditHotel);
router.post('/hotels/:id/edit', adminController.postEditHotel);
router.get('/hotels/:id/rooms', adminController.getHotelRooms);
router.get('/hotels/:id/delete', adminController.deleteHotel);

// New route for managing rooms
router.get('/hotels/:id/manage-rooms', adminController.manageRooms);

// New routes for adding a room
router.get('/hotels/:id/rooms/add', adminController.getAddRoom);
router.post('/hotels/:id/rooms/add', (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            req.flash('error', `File upload error: ${err.message}`);
            return res.redirect(`/admin/hotels/${req.params.id}/manage-rooms`);
        } else if (err) {
            console.error('Unknown error:', err);
            req.flash('error', `Unknown error: ${err.message}`);
            return res.redirect(`/admin/hotels/${req.params.id}/manage-rooms`);
        }

        try {
            const roomData = {
                ...req.body,
                hotel: req.params.id
            };

            if (req.files.room_images) {
                roomData.images = req.files.room_images.map(file => file.filename);
            }

            await adminController.createRoom(roomData);

            req.flash('success', 'Room added successfully');
            res.redirect(`/admin/hotels/${req.params.id}/manage-rooms`);
        } catch (error) {
            console.error('Error saving room:', error);
            req.flash('error', 'Error saving room: ' + error.message);
            res.redirect(`/admin/hotels/${req.params.id}/manage-rooms`);
        }
    });
});

// New route for fetching purchases with pagination
router.get('/purchases', adminController.getPurchases);

// New route for fetching current purchases (with "Paid" status)
router.get('/currentPurchases', adminController.getCurrentPurchases);

// New route for user details
router.get('/userDetails/:id', adminController.getUserDetails);

// Golf routes
router.get('/golf-courses', adminController.getGolfCourses);
router.get('/golf-courses/add', adminController.getAddGolfCourseForm);
router.post('/golf-courses/add', upload, adminController.addGolfCourse);
router.get('/golf-courses/:id/golf-details', adminController.getGolfCourseDetails);
router.get('/golf-courses/:id/edit', adminController.getEditGolfCourse);
router.post('/golf-courses/:id/edit', upload, adminController.postEditGolfCourse);
router.get('/golf-courses/:id/delete', adminController.deleteGolfCourse);
// Voucher routes
router.get('/vouchers', adminController.getVouchers);
router.post('/change-user-password', adminController.changeUserPassword);
module.exports = router;
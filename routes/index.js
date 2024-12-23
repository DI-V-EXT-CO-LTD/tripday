// routes/index.js
const express = require('express');
const router = express.Router();
const Hotel = require('../models/hotel');
const Golf = require('../models/golf');
const User = require('../models/user');
const adminController = require('../controllers/adminController');
const hotelController = require('../controllers/hotelController');
const Vouchers = require('../models/voucher');


router.get('/', async (req, res) => {
    try {
        const hotels = await Hotel.find({$where: "this.rooms.length > 0"})
            .select('id title image_id star_rate facilityTags price slug')
            .populate('rooms');
        const golfCourses = await Golf.find({})
            .select('id title slug image_id ratingInfo facilityTags price');
        const bestsellers = await Hotel.find({$where: "this.rooms.length > 0", isPromotion: true, promotionType: "BestSellers"})
        .select('id title image_id star_rate facilityTags price slug content')
        .populate('rooms');

        const firesales = await Hotel.find({$where: "this.rooms.length > 0", isPromotion: true, promotionType: "FireSales"})
        .select('id title image_id star_rate facilityTags price slug content')
        .populate('rooms');

        const earlybird = await Hotel.find({$where: "this.rooms.length > 0", isPromotion: true, promotionType: "EarlyBird"})
        .select('id title image_id star_rate facilityTags price slug content')
        .populate('rooms');
        res.render('index', { user: req.user, hotels, golfCourses, bestsellers, firesales, earlybird });

        
    } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error stack:', error.stack);
        res.status(500).send(`Error fetching data: ${error.message}`);
    }
});

router.get('/testing', async (req, res) => {
    console.log("Testing")
    const UpdateAllHotels = await Hotel.updateMany({isPromotion: true, promotionType: "BestSellers", promotionStartDate: null, promotionEndDate: null, voucherAmount: 20000});
    const UpdateAllGolfs = await Golf.updateMany({isPromotion: false, promotionType: "", promotionStartDate: null, promotionEndDate: null, voucherAmount: 20000});
    res.send("complete")
});

// New route for hotel search
router.get('/search', hotelController.searchHotels);



// Updated hotel details route
router.get('/hotel-details/:slug', async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ slug: req.params.slug }).populate('rooms');
        if (!hotel) {
            return res.status(404).send('Hotel not found');
        }

        res.render('hotelDetails', { 
            user: req.user, 
            hotel
        });
    } catch (error) {
        console.error('Error fetching hotel details:', error);
        res.status(500).send('Error fetching hotel details');
    }
});

router.get('/v3/test/changeboard', async (req, res) => {
    let ModifyAllUserIds = await Vouchers.updateMany({userId: "perfectholders2877@gmail.com"});
    res.send('Change Complete');
});

// Admin routes
router.get('/admin/dashboard', adminController.getDashboard);
router.get('/admin/users', adminController.getUsers);
router.get('/admin/vouchers', adminController.getVouchers);
router.get('/admin/invoices', adminController.getInvoices);

// New route for hotel registration API
router.post('/api/hotels', hotelController.registerHotel);

// Best Sellers route
router.get('/best-sellers', (req, res) => {
    res.redirect('/promotions');
});

// New route for promotions
router.get('/promotions', hotelController.getPromotions);
// 로그인 확인 미들웨어 함수
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    alert('로그인이 필요합니다.');
    res.redirect('/');
  }
module.exports = router;

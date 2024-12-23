const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBookingDetails);
router.post('/create', bookingController.createPurchase);

module.exports = router;
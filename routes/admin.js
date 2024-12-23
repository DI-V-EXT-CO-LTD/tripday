const express = require('express');
const router = express.Router();

// Import the controller (we'll create this next)
const adminController = require('../controllers/adminController');

// Hotel routes
router.get('/hotels', adminController.getHotels);
router.get('/hotels/:id/details', adminController.getHotelDetails);
router.get('/hotels/:id/edit', adminController.getEditHotel);
router.post('/hotels/:id/edit', adminController.postEditHotel);
router.get('/hotels/:id/rooms', adminController.getHotelRooms);
router.get('/hotels/:id/delete', adminController.deleteHotel);



module.exports = router;
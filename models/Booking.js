const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: String,
  Hotel: String,
  Amount: Number,
  useDate: Date,
  createAt: Date,
  CustomerInfo: []
});


const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;

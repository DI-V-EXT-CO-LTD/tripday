// models/reservation.js
const mongoose = require('mongoose');
const User = require('./user');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
  reservationCode: { type: String, required: true, unique: true }, // 예약 코드 필드 추가
  voucherCode: { type: String, required: true },
  customerName: { type: String, required: true },
  roomAmount: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  usedVouchers: { type: Number, required: true },
  status: { // 예약 단계 필드 추가
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'],
    default: 'PENDING'
  },
  createdAt: { type: Date, default: Date.now },
  userId: { type: String, required: false },
});

module.exports = mongoose.model('Reservation', reservationSchema);

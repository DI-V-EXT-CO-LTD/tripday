// models/voucher.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const voucherSchema = new Schema({
  voucherCode: { type: String, required: true, unique: true },
  bookingCode: { type: String, required: true },
  roomId: { type: Number, required: true },
  roomTitle: { type: String, required: true },
  quantity: { type: Number, required: true },
  initialQuantity: { type: Number, required: true },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  customer_first_name: { type: String, required: false },
  customer_last_name: { type: String, required: false },
  hotelName: { type: String, required: true },
  userId: { type: String, required: false },
  createAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Voucher', voucherSchema);

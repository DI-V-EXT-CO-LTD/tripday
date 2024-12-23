// models/inv.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  bookingCode: String,
  invoiceId: String,
  total: Number,
  hotelName: String,
  roomNames: [String],
  transactionNo: Number,
  totalTransactions: Number,
  invoiceNumber: String,
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Sent', 'Cancelled', 'Published'],
    default: 'Published'
  },
  remittanceNumber: String,
  remittanceImage: String,
  ImageUrl: String,
  userId: String,
  createAt: {
    type: Date,
    default: Date.now
  }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;

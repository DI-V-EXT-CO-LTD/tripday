const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  purchaseId: {
    type: String,
    required: true,
    
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hotelName: {
    type: String,
    required: true
  },
  roomName: {
    type: String,
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },  
  checkOut: {
    type: Date,
    required: true
  },
  nights: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending','Paid', 'Preparing', 'Confirmed', 'Processing', 'Publishing', 'publishing', 'Complete', 'Cancelled', 'Failed', 'Refunded', 'Expired'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  voucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher'
  },
  processDescription: {
    type: String,
    default: 'Processing'
  },
  invoice: {
    type: String,
    
  },
  purchaseLog: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String
  }]
}, {
  timestamps: true // This will automatically update the updatedAt field
});

module.exports = mongoose.model('Purchase', purchaseSchema);
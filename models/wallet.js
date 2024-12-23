const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  thbBalance: {
    type: Number,
    default: 0
  },
  usdtBalance: {
    type: Number,
    default: 0
  },
  transactions: [{
    type: {
      type: String,
      enum: ['deposit', 'withdrawal'],
      required: true
    },
    currency: {
      type: String,
      enum: ['THB', 'USDT'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('Wallet', walletSchema);
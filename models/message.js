const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  recipient: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isIndividualMesssage: {type: Boolean, default: false},
  isCustomerServiceMessage: {type: Boolean, default: false},
  sender: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false
  },  
  readAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Message', messageSchema);
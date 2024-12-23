// models/emailLog.js
const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  from: String,
  to: String,
  subject: String,
  text: String,
  createAt: { type: Date, default: Date.now }
});

const EmailLog = mongoose.model('emailLog', emailLogSchema);

module.exports = EmailLog;

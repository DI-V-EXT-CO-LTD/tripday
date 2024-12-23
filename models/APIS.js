const mongoose = require('mongoose');

const apisSchema = new mongoose.Schema({
  userId: String,
  Hotel: String,
  Amount: Number,
  useDate_Start: Date,
  useDate_End: Date,
  createAt: Date,
  CustomerInfo: []
});


const APIS = mongoose.model('APIS', apisSchema);

module.exports = APIS;

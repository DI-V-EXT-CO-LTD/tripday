const mongoose = require('mongoose');

const locationCatetories = new mongoose.Schema({
    locationId: { type: String, unique: true, required: true },
    locationName: { type: String, unique: true, required: true },
  });

  module.exports = mongoose.model('locationCategories', locationCatetories);
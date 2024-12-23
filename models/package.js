const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  nameEn: {
    type: String,
    required: true
  },
  image_id: {
    type: String,
    required: true
  },
  banner_image_id: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  gallery: [{
    type: String
  }],
  price: {
    type: Number,
    required: true
  },
  tee_time: {
    type: String,
    required: true
  },
  sale_price: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: "draft"
  },
  min_day_before_booking: {
    type: Number,
    default: 0
  },
  isPromotion: {
    type: Boolean,
    default: false
  },
  voucherAmount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Package', packageSchema);
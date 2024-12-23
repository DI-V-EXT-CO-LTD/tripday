// models/promotionCategory.js
const mongoose = require('mongoose');

const promotionCategorySchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
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

// 16자리 ID 생성을 위한 pre-save 미들웨어 추가
promotionCategorySchema.pre('save', function(next) {
  if (!this.id) {
    this.id = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
  }
  next();
});

module.exports = mongoose.model('PromotionCategory', promotionCategorySchema);
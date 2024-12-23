// models/cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room'},
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  check_in: { type: Date },
  check_out: { type: Date },
  nights: { type: Number, required: true },
  isSelected: { type: Boolean, default: false },
  ProductType: String,
  golf: { type: mongoose.Schema.Types.ObjectId, ref: 'Golf' },
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' }
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [cartItemSchema],
  total: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

cartSchema.pre('save', function(next) {
  this.total = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
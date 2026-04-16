'use strict';

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'], max: [10, 'Max 10 per item'] },
  price: { type: Number, required: true }, // Snapshot price at add time
  name: { type: String, required: true }, // Snapshot name
  image: { type: String, default: '' }, // Snapshot image
}, { _id: true, timestamps: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  couponCode: { type: String, uppercase: true, trim: true },
  couponDiscount: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.virtual('total').get(function () {
  return Math.max(0, this.subtotal - (this.couponDiscount || 0));
});

cartSchema.index({ user: 1 });

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;

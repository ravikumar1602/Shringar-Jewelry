'use strict';
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number },
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  userUsageLimit: { type: Number, default: 1 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  description: { type: String, trim: true },
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, endDate: 1 });

couponSchema.methods.isValid = function (orderAmount, userId) {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: 'Coupon is not active' };
  if (now < this.startDate) return { valid: false, message: 'Coupon is not yet active' };
  if (now > this.endDate) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (orderAmount < this.minOrderAmount) return { valid: false, message: `Minimum order amount is ₹${this.minOrderAmount}` };
  if (userId && this.usedBy.filter(id => id.toString() === userId.toString()).length >= this.userUsageLimit) {
    return { valid: false, message: 'You have already used this coupon' };
  }
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (orderAmount) {
  let discount = this.type === 'percentage'
    ? (orderAmount * this.value) / 100
    : this.value;
  if (this.maxDiscountAmount) discount = Math.min(discount, this.maxDiscountAmount);
  return Math.round(discount * 100) / 100;
};

module.exports = mongoose.model('Coupon', couponSchema);

'use strict';

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  sku: { type: String },
}, { _id: true });

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
}, { _id: false });

const trackingEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  message: { type: String, required: true },
  location: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: { type: shippingAddressSchema, required: true },

  // Pricing
  subtotal: { type: Number, required: true },
  shippingCharge: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String },
  totalAmount: { type: Number, required: true },

  // Payment
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod', 'upi', 'netbanking'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  paidAt: { type: Date },

  // Order status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned'],
    default: 'pending',
  },

  // Shipping
  trackingNumber: { type: String },
  trackingUrl: { type: String },
  courierName: { type: String },
  estimatedDelivery: { type: Date },
  deliveredAt: { type: Date },

  // Tracking history
  trackingHistory: [trackingEventSchema],

  // Cancellation / Return
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  cancelledBy: { type: String, enum: ['user', 'admin'] },
  returnReason: { type: String },
  returnRequestedAt: { type: Date },
  refundAmount: { type: Number },
  refundedAt: { type: Date },

  notes: { type: String },
  adminNotes: { type: String },
  isReviewed: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ createdAt: -1 });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.orderNumber = `SHR${year}${month}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;

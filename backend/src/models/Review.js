'use strict';

const mongoose = require('mongoose');
const Product = require('./Product');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: [true, 'Rating is required'], min: 1, max: 5 },
  title: { type: String, trim: true, maxlength: 100 },
  comment: { type: String, trim: true, maxlength: 1000 },
  images: [{ url: String, publicId: String }],
  isVerifiedPurchase: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  helpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  adminReply: { type: String, trim: true },
  adminReplyAt: { type: Date },
}, { timestamps: true });

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });

reviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: '$product', nRating: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: stats[0].avgRating,
      ratingsCount: stats[0].nRating,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { ratingsAverage: 0, ratingsCount: 0 });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.product);
});

reviewSchema.post('remove', function () {
  this.constructor.calcAverageRatings(this.product);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;

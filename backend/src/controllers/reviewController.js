'use strict';

const Review = require('../models/Review');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const APIFeatures = require('../utils/apiFeatures');

exports.getProductReviews = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Review.find({ product: req.params.productId, isApproved: true })
        .populate('user', 'name avatar'),
      req.query
    ).sort().paginate();

    const [reviews, total] = await Promise.all([
      features.query,
      Review.countDocuments({ product: req.params.productId, isApproved: true }),
    ]);

    const { page, limit } = features.paginationInfo;
    res.json({ success: true, pagination: { total, page, limit }, data: { reviews } });
  } catch (err) { next(err); }
};

exports.createReview = async (req, res, next) => {
  try {
    const existing = await Review.findOne({ product: req.params.productId, user: req.user._id });
    if (existing) return next(new AppError('You have already reviewed this product', 400));

    // Check if verified purchase
    const order = await Order.findOne({
      user: req.user._id,
      'items.product': req.params.productId,
      status: 'delivered',
    });

    const images = req.files?.map((f) => ({ url: f.path, publicId: f.filename })) || [];
    const review = await Review.create({
      ...req.body,
      product: req.params.productId,
      user: req.user._id,
      order: order?._id,
      isVerifiedPurchase: !!order,
      images,
    });

    if (order) {
      await Order.findByIdAndUpdate(order._id, { isReviewed: true });
    }

    await review.populate('user', 'name avatar');
    res.status(201).json({ success: true, message: 'Review submitted', data: { review } });
  } catch (err) { next(err); }
};

exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) return next(new AppError('Review not found', 404));

    Object.assign(review, { rating: req.body.rating, title: req.body.title, comment: req.body.comment });
    await review.save();

    res.json({ success: true, message: 'Review updated', data: { review } });
  } catch (err) { next(err); }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      ...(req.user.role === 'user' ? { user: req.user._id } : {}),
    });
    if (!review) return next(new AppError('Review not found', 404));
    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
};

exports.voteHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new AppError('Review not found', 404));

    const idx = review.helpfulVotes.indexOf(req.user._id);
    if (idx > -1) review.helpfulVotes.splice(idx, 1);
    else review.helpfulVotes.push(req.user._id);

    await review.save();
    res.json({ success: true, data: { helpfulCount: review.helpfulVotes.length } });
  } catch (err) { next(err); }
};

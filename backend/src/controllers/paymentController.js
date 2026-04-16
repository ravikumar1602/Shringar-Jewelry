'use strict';

const Order = require('../models/Order');
const { createOrder, verifyPaymentSignature, fetchPayment, refundPayment } = require('../config/razorpay');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return next(new AppError('Order not found', 404));
    if (order.paymentStatus === 'paid') return next(new AppError('Order already paid', 400));

    const razorpayOrder = await createOrder({
      amount: order.totalAmount,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: order._id.toString(), userId: req.user._id.toString() },
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        orderNumber: order.orderNumber,
        prefill: {
          name: req.user.name,
          email: req.user.email,
          contact: req.user.phone || '',
        },
      },
    });
  } catch (err) { next(err); }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      logger.warn(`Payment signature mismatch for order ${orderId}`);
      return next(new AppError('Payment verification failed. Invalid signature.', 400));
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return next(new AppError('Order not found', 404));

    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paidAt = new Date();
    order.trackingHistory.push({ status: 'confirmed', message: 'Payment received. Order confirmed.' });
    await order.save();

    logger.info(`Payment verified for order ${order.orderNumber}`);
    res.json({ success: true, message: 'Payment verified successfully', data: { order } });
  } catch (err) { next(err); }
};

exports.getPaymentDetails = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
    if (!order) return next(new AppError('Order not found', 404));
    if (!order.razorpayPaymentId) return next(new AppError('No payment found for this order', 404));

    const payment = await fetchPayment(order.razorpayPaymentId);
    res.json({ success: true, data: { payment } });
  } catch (err) { next(err); }
};

exports.processRefund = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return next(new AppError('Order not found', 404));
    if (!order.razorpayPaymentId) return next(new AppError('No payment to refund', 400));
    if (order.paymentStatus === 'refunded') return next(new AppError('Already refunded', 400));

    const refundAmount = req.body.amount || order.totalAmount;
    const refund = await refundPayment(order.razorpayPaymentId, refundAmount);

    order.paymentStatus = refundAmount < order.totalAmount ? 'partially_refunded' : 'refunded';
    order.refundAmount = refundAmount;
    order.refundedAt = new Date();
    order.trackingHistory.push({ status: order.status, message: `Refund of ₹${refundAmount} processed` });
    await order.save();

    res.json({ success: true, message: `Refund of ₹${refundAmount} processed`, data: { refund } });
  } catch (err) { next(err); }
};

// Razorpay webhook handler
exports.razorpayWebhook = async (req, res, next) => {
  try {
    const crypto = require('crypto');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(200).json({ received: true });

    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    const expectedSig = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');

    if (signature !== expectedSig) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;
    if (event === 'payment.captured') {
      const { order_id, id: payment_id } = payload.payment.entity;
      await Order.findOneAndUpdate(
        { razorpayOrderId: order_id },
        { paymentStatus: 'paid', status: 'confirmed', razorpayPaymentId: payment_id, paidAt: new Date() }
      );
    }

    res.status(200).json({ received: true });
  } catch (err) { next(err); }
};

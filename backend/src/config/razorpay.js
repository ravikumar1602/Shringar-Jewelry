'use strict';

const Razorpay = require('razorpay');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes,
      payment_capture: 1,
    });
    return order;
  } catch (err) {
    throw new AppError(`Payment order creation failed: ${err.message}`, 500);
  }
};

const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

const fetchPayment = async (paymentId) => {
  try {
    return await razorpay.payments.fetch(paymentId);
  } catch (err) {
    throw new AppError(`Payment fetch failed: ${err.message}`, 500);
  }
};

const refundPayment = async (paymentId, amount) => {
  try {
    return await razorpay.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  } catch (err) {
    throw new AppError(`Refund failed: ${err.message}`, 500);
  }
};

module.exports = { razorpay, createOrder, verifyPaymentSignature, fetchPayment, refundPayment };

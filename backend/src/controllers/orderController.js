'use strict';

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const AppError = require('../utils/AppError');
const APIFeatures = require('../utils/apiFeatures');
const { sendEmail, emailTemplates } = require('../utils/email');
const logger = require('../utils/logger');

const SHIPPING_THRESHOLD = 999;
const SHIPPING_CHARGE = 99;
const TAX_RATE = 0.03; // 3% GST example

exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddressId, paymentMethod, notes } = req.body;

    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name price stock trackInventory images sku isActive');

    if (!cart || cart.items.length === 0) return next(new AppError('Cart is empty', 400));

    const user = req.user;
    const address = user.addresses.id(shippingAddressId);
    if (!address) return next(new AppError('Shipping address not found', 404));

    // Validate stock & build order items
    const orderItems = [];
    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        return next(new AppError(`Product "${item.name}" is no longer available`, 400));
      }
      if (item.product.trackInventory && item.product.stock < item.quantity) {
        return next(new AppError(`Insufficient stock for "${item.product.name}"`, 400));
      }
      const mainImg = item.product.images?.find((i) => i.isMain) || item.product.images?.[0];
      orderItems.push({
        product: item.product._id,
        variantId: item.variantId,
        name: item.product.name,
        image: mainImg?.url || item.image,
        price: item.price,
        quantity: item.quantity,
        sku: item.product.sku,
      });
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingCharge = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
    const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
    let discountAmount = cart.couponDiscount || 0;
    const totalAmount = Math.round((subtotal + shippingCharge + taxAmount - discountAmount) * 100) / 100;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      },
      subtotal,
      shippingCharge,
      taxAmount,
      discountAmount,
      couponCode: cart.couponCode,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      status: 'pending',
      notes,
      trackingHistory: [{ status: 'pending', message: 'Order placed successfully' }],
    });

    // Deduct stock
    for (const item of cart.items) {
      if (item.product.trackInventory) {
        if (item.variantId) {
          await Product.findOneAndUpdate(
            { _id: item.product._id, 'variants._id': item.variantId },
            { $inc: { 'variants.$.stock': -item.quantity } }
          );
        } else {
          await Product.findByIdAndUpdate(item.product._id, {
            $inc: { stock: -item.quantity, soldCount: item.quantity },
          });
        }
      }
    }

    // Mark coupon as used
    if (cart.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: cart.couponCode },
        { $inc: { usedCount: 1 }, $push: { usedBy: req.user._id } }
      );
    }

    // Clear cart
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], couponCode: null, couponDiscount: 0 }
    );

    // Send confirmation email async
    try {
      const tmpl = emailTemplates.orderConfirmation(order, req.user);
      await sendEmail({ to: req.user.email, ...tmpl });
    } catch (e) {
      logger.warn(`Order confirmation email failed: ${e.message}`);
    }

    await order.populate('items.product', 'name images');
    res.status(201).json({ success: true, message: 'Order placed successfully', data: { order } });
  } catch (err) { next(err); }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Order.find({ user: req.user._id }),
      req.query
    ).filter().sort().paginate();

    const [orders, total] = await Promise.all([
      features.query.populate('items.product', 'name images slug'),
      Order.countDocuments({ user: req.user._id }),
    ]);

    const { page, limit } = features.paginationInfo;
    res.json({
      success: true,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      data: { orders },
    });
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('items.product', 'name images slug');
    if (!order) return next(new AppError('Order not found', 404));
    res.json({ success: true, data: { order } });
  } catch (err) { next(err); }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return next(new AppError('Order not found', 404));

    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
      return next(new AppError(`Order cannot be cancelled when status is "${order.status}"`, 400));
    }

    order.status = 'cancelled';
    order.cancellationReason = req.body.reason || 'Cancelled by customer';
    order.cancelledAt = new Date();
    order.cancelledBy = 'user';
    order.trackingHistory.push({
      status: 'cancelled',
      message: `Order cancelled by customer: ${order.cancellationReason}`,
    });

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, soldCount: -item.quantity },
      });
    }

    await order.save();
    res.json({ success: true, message: 'Order cancelled successfully', data: { order } });
  } catch (err) { next(err); }
};

exports.requestReturn = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return next(new AppError('Order not found', 404));
    if (order.status !== 'delivered') return next(new AppError('Only delivered orders can be returned', 400));

    const deliveredDate = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) return next(new AppError('Return window (7 days) has expired', 400));

    order.status = 'return_requested';
    order.returnReason = req.body.reason;
    order.returnRequestedAt = new Date();
    order.trackingHistory.push({ status: 'return_requested', message: `Return requested: ${req.body.reason}` });

    await order.save();
    res.json({ success: true, message: 'Return request submitted', data: { order } });
  } catch (err) { next(err); }
};

// ─── Admin Order Management ───────────────────────────────────────────────────
exports.adminGetOrders = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Order.find().populate('user', 'name email phone'),
      req.query
    ).filter().sort().paginate();

    const [orders, total] = await Promise.all([
      features.query,
      Order.countDocuments(),
    ]);
    const { page, limit } = features.paginationInfo;
    res.json({
      success: true,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      data: { orders },
    });
  } catch (err) { next(err); }
};

exports.adminUpdateOrder = async (req, res, next) => {
  try {
    const { status, trackingNumber, trackingUrl, courierName, adminNotes, estimatedDelivery } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError('Order not found', 404));

    const updates = {};
    if (status) {
      updates.status = status;
      if (status === 'delivered') updates.deliveredAt = new Date();
      order.trackingHistory.push({
        status,
        message: `Status updated to ${status} by admin`,
        location: req.body.location,
      });
    }
    if (trackingNumber) updates.trackingNumber = trackingNumber;
    if (trackingUrl) updates.trackingUrl = trackingUrl;
    if (courierName) updates.courierName = courierName;
    if (adminNotes) updates.adminNotes = adminNotes;
    if (estimatedDelivery) updates.estimatedDelivery = estimatedDelivery;

    Object.assign(order, updates);
    await order.save();

    res.json({ success: true, message: 'Order updated', data: { order } });
  } catch (err) { next(err); }
};

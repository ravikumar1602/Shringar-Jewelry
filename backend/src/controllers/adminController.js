'use strict';

const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const [
      totalRevenue, monthRevenue, lastMonthRevenue,
      totalOrders, monthOrders, pendingOrders, todayOrders,
      totalUsers, monthUsers,
      totalProducts, lowStockCount, outOfStockCount,
      recentOrders, topProducts, ordersByStatus,
    ] = await Promise.all([
      Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'processing'] } }),
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: startOfMonth } }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, trackInventory: true, stock: { $lte: 5, $gt: 0 } }),
      Product.countDocuments({ isActive: true, trackInventory: true, stock: 0 }),
      Order.find().sort('-createdAt').limit(10).populate('user', 'name email'),
      Product.find({ isActive: true }).sort('-soldCount').limit(5).select('name images soldCount price'),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const currentMonthRev = monthRevenue[0]?.total || 0;
    const lastMonthRev = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = lastMonthRev > 0
      ? Math.round(((currentMonthRev - lastMonthRev) / lastMonthRev) * 100)
      : 100;

    res.json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue[0]?.total || 0,
          thisMonth: currentMonthRev,
          lastMonth: lastMonthRev,
          growth: revenueGrowth,
        },
        orders: { total: totalOrders, thisMonth: monthOrders, pending: pendingOrders, today: todayOrders },
        users: { total: totalUsers, thisMonth: monthUsers },
        products: { total: totalProducts, lowStock: lowStockCount, outOfStock: outOfStockCount },
        recentOrders,
        topProducts,
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (err) { next(err); }
};

exports.getSalesAnalytics = async (req, res, next) => {
  try {
    const { period = '12' } = req.query;
    const months = Math.min(24, Math.max(1, parseInt(period)));
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const salesData = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const categoryRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $lookup: { from: 'categories', localField: 'product.category', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $group: { _id: '$category.name', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, sold: { $sum: '$items.quantity' } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, data: { salesData, categoryRevenue } });
  } catch (err) { next(err); }
};

exports.getInventoryReport = async (req, res, next) => {
  try {
    const [lowStock, outOfStock, allProducts] = await Promise.all([
      Product.find({ isActive: true, trackInventory: true, stock: { $lte: 5, $gt: 0 } })
        .select('name sku stock price category images').populate('category', 'name'),
      Product.find({ isActive: true, trackInventory: true, stock: 0 })
        .select('name sku stock price category images').populate('category', 'name'),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalItems: { $sum: 1 }, totalStock: { $sum: '$stock' }, totalValue: { $sum: { $multiply: ['$price', '$stock'] } } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        summary: allProducts[0] || { totalItems: 0, totalStock: 0, totalValue: 0 },
        lowStock,
        outOfStock,
      },
    });
  } catch (err) { next(err); }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = { role: { $in: ['user', 'admin'] } };
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (role) query.role = role;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).select('+isActive').sort('-createdAt').skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
      data: { users },
    });
  } catch (err) { next(err); }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive, role } = req.body;
    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role) {
      if (!['user', 'admin'].includes(role)) return next(new AppError('Invalid role', 400));
      updateData.role = role;
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('+isActive');
    if (!user) return next(new AppError('User not found', 404));
    res.json({ success: true, message: 'User updated', data: { user } });
  } catch (err) { next(err); }
};

exports.manageCoupons = async (req, res, next) => {
  try {
    const Coupon = require('../models/Coupon');
    const { action } = req.params;

    if (req.method === 'GET') {
      const coupons = await Coupon.find().sort('-createdAt');
      return res.json({ success: true, data: { coupons } });
    }
    if (req.method === 'POST') {
      const coupon = await Coupon.create(req.body);
      return res.status(201).json({ success: true, data: { coupon } });
    }
    if (req.method === 'PUT') {
      const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return res.json({ success: true, data: { coupon } });
    }
    if (req.method === 'DELETE') {
      await Coupon.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Coupon deleted' });
    }
  } catch (err) { next(err); }
};

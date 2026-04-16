'use strict';

const crypto = require('crypto');
const User = require('../models/User');
const { generateTokenPair, verifyToken } = require('../utils/jwt');
const { sendEmail, emailTemplates } = require('../utils/email');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const { accessToken, refreshToken } = generateTokenPair(user._id, user.role);
  user.password = undefined;
  user.isActive = undefined;
  res.status(statusCode).json({
    success: true,
    message,
    data: { user, accessToken, refreshToken },
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return next(new AppError('Email already registered. Please log in.', 409));

    const user = await User.create({ name, email, password, phone, role: 'user' });
    try {
      const tmpl = emailTemplates.welcomeEmail(user);
      await sendEmail({ to: user.email, ...tmpl });
    } catch (e) {
      logger.warn(`Welcome email failed for ${user.email}: ${e.message}`);
    }

    logger.info(`New user registered: ${user.email}`);
    sendTokenResponse(user, 201, res, 'Account created successfully');
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password +isActive +loginAttempts +lockUntil +passwordChangedAt');

    if (!user) return next(new AppError('Invalid email or password', 401));
    if (user.isLocked()) return next(new AppError('Account temporarily locked due to too many failed attempts. Try again later.', 423));
    if (!user.isActive) return next(new AppError('Account deactivated. Please contact support.', 403));

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return next(new AppError('Invalid email or password', 401));
    }

    await User.findByIdAndUpdate(user._id, {
      loginAttempts: 0,
      $unset: { lockUntil: 1 },
      lastLogin: new Date(),
    });

    logger.info(`User logged in: ${user.email}`);
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (err) { next(err); }
};

exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase(), role: { $in: ['admin', 'superadmin'] } })
      .select('+password +isActive +passwordChangedAt');

    if (!user) return next(new AppError('Invalid credentials or insufficient permissions', 401));
    if (!user.isActive) return next(new AppError('Account deactivated', 403));

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(new AppError('Invalid credentials', 401));

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    sendTokenResponse(user, 200, res, 'Admin login successful');
  } catch (err) { next(err); }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError('Refresh token required', 400));

    const decoded = await verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+isActive');
    if (!user || !user.isActive) return next(new AppError('User not found or inactive', 401));

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user._id, user.role);
    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      // Security: Don't reveal if email exists
      return res.json({ success: true, message: 'If that email is registered, you will receive a reset link.' });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    try {
      const tmpl = emailTemplates.passwordReset(resetUrl);
      await sendEmail({ to: user.email, ...tmpl });
    } catch (e) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Failed to send reset email. Try again later.', 500));
    }

    res.json({ success: true, message: 'If that email is registered, you will receive a reset link.' });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) return next(new AppError('Invalid or expired reset token', 400));

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password reset successful');
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) return next(new AppError('Current password is incorrect', 400));

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password changed successfully');
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'name images price slug');
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone'];
    const updateData = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

    if (req.file) {
      updateData.avatar = { url: req.file.path, publicId: req.file.filename };
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated', data: { user } });
  } catch (err) { next(err); }
};

exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.addresses.length >= 5) return next(new AppError('Maximum 5 addresses allowed', 400));

    if (req.body.isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
    }
    if (user.addresses.length === 0) req.body.isDefault = true;

    user.addresses.push(req.body);
    await user.save();
    res.status(201).json({ success: true, message: 'Address added', data: { addresses: user.addresses } });
  } catch (err) { next(err); }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.addressId);
    if (!addr) return next(new AppError('Address not found', 404));

    if (req.body.isDefault) user.addresses.forEach((a) => { a.isDefault = false; });
    Object.assign(addr, req.body);
    await user.save();
    res.json({ success: true, message: 'Address updated', data: { addresses: user.addresses } });
  } catch (err) { next(err); }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.addressId);
    if (!addr) return next(new AppError('Address not found', 404));
    addr.deleteOne();
    await user.save();
    res.json({ success: true, message: 'Address removed', data: { addresses: user.addresses } });
  } catch (err) { next(err); }
};

exports.toggleWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;
    const idx = user.wishlist.findIndex((id) => id.toString() === productId);
    let message;
    if (idx > -1) { user.wishlist.splice(idx, 1); message = 'Removed from wishlist'; }
    else { user.wishlist.push(productId); message = 'Added to wishlist'; }
    await user.save();
    res.json({ success: true, message, data: { wishlist: user.wishlist } });
  } catch (err) { next(err); }
};

exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

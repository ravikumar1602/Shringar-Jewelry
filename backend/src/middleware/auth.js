'use strict';

const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    const decoded = await verifyToken(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('+passwordChangedAt +isActive');
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact support.', 401));
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('Password was recently changed. Please log in again.', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = await verifyToken(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('+isActive');
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch {
    next(); // Continue without auth
  }
};

module.exports = { protect, restrictTo, optionalAuth };

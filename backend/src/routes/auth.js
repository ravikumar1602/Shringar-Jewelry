'use strict';
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');
const c = require('../controllers/authController');

const pwdValidation = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number');

router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  pwdValidation,
  validate,
], c.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
], c.login);

router.post('/admin/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
], c.adminLogin);

router.post('/refresh-token', c.refreshToken);
router.post('/forgot-password', [body('email').isEmail().normalizeEmail(), validate], c.forgotPassword);
router.patch('/reset-password/:token', [pwdValidation, validate], c.resetPassword);
router.post('/logout', protect, c.logout);
router.get('/me', protect, c.getMe);
router.patch('/update-profile', protect, uploadAvatar.single('avatar'), c.updateProfile);
router.patch('/change-password', protect, [
  body('currentPassword').notEmpty(),
  pwdValidation,
  validate,
], c.changePassword);
router.post('/addresses', protect, c.addAddress);
router.put('/addresses/:addressId', protect, c.updateAddress);
router.delete('/addresses/:addressId', protect, c.deleteAddress);
router.post('/wishlist/:productId', protect, c.toggleWishlist);

module.exports = router;

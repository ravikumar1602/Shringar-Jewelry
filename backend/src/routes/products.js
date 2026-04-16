'use strict';
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const { uploadProduct } = require('../config/cloudinary');
const c = require('../controllers/productController');

router.get('/', c.getProducts);
router.get('/featured', c.getFeaturedProducts);
router.get('/admin/all', protect, restrictTo('admin', 'superadmin'), c.adminGetProducts);
router.get('/low-stock', protect, restrictTo('admin', 'superadmin'), c.getLowStockProducts);
router.get('/:id', optionalAuth, c.getProduct);
router.get('/:id/related', c.getRelatedProducts);

router.post('/', protect, restrictTo('admin', 'superadmin'), uploadProduct.array('images', 8), [
  body('name').trim().isLength({ min: 3 }).withMessage('Product name required'),
  body('price').isNumeric().isFloat({ min: 0 }).withMessage('Valid price required'),
  body('category').isMongoId().withMessage('Valid category required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description required'),
  validate,
], c.createProduct);

router.put('/:id', protect, restrictTo('admin', 'superadmin'), uploadProduct.array('images', 8), c.updateProduct);
router.delete('/:id/images/:imageId', protect, restrictTo('admin', 'superadmin'), c.deleteProductImage);
router.patch('/:id/inventory', protect, restrictTo('admin', 'superadmin'), c.updateInventory);
router.delete('/:id', protect, restrictTo('admin', 'superadmin'), c.deleteProduct);

module.exports = router;

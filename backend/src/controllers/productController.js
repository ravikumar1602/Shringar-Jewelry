'use strict';

const Product = require('../models/Product');
const Category = require('../models/Category');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/AppError');
const { deleteMultipleFromCloudinary } = require('../config/cloudinary');

exports.getProducts = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Product.find({ isActive: true }).populate('category', 'name slug'),
      req.query
    ).filter().search(['name', 'description', 'tags']).sort().limitFields().paginate();

    const [products, total] = await Promise.all([
      features.query,
      Product.countDocuments({ isActive: true }),
    ]);

    const { page, limit } = features.paginationInfo;
    res.json({
      success: true,
      results: products.length,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      data: { products },
    });
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { slug: req.params.id };

    const product = await Product.findOne({ ...query, isActive: true })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug');

    if (!product) return next(new AppError('Product not found', 404));

    await Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } });

    res.json({ success: true, data: { product } });
  } catch (err) { next(err); }
};

exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('category', 'name slug')
      .sort('-createdAt')
      .limit(12);
    res.json({ success: true, data: { products } });
  } catch (err) { next(err); }
};

exports.getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    }).limit(8).populate('category', 'name slug');

    res.json({ success: true, data: { products: related } });
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const category = await Category.findById(req.body.category);
    if (!category) return next(new AppError('Invalid category', 400));

    const images = req.files?.map((file, i) => ({
      url: file.path,
      publicId: file.filename,
      alt: req.body.name || 'Product image',
      isMain: i === 0,
    })) || [];

    // Parse JSON fields from form-data
    ['variants', 'tags', 'occasion', 'dimensions'].forEach((field) => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        try { req.body[field] = JSON.parse(req.body[field]); } catch {}
      }
    });

    const product = await Product.create({ ...req.body, images });
    res.status(201).json({ success: true, message: 'Product created', data: { product } });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));

    if (req.files?.length > 0) {
      const newImages = req.files.map((file, i) => ({
        url: file.path,
        publicId: file.filename,
        alt: req.body.name || 'Product image',
        isMain: product.images.length === 0 && i === 0,
      }));
      req.body.images = [...product.images, ...newImages];
    }

    ['variants', 'tags', 'occasion', 'dimensions'].forEach((field) => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        try { req.body[field] = JSON.parse(req.body[field]); } catch {}
      }
    });

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('category', 'name slug');

    res.json({ success: true, message: 'Product updated', data: { product: updated } });
  } catch (err) { next(err); }
};

exports.deleteProductImage = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));

    const { imageId } = req.params;
    const image = product.images.id(imageId);
    if (!image) return next(new AppError('Image not found', 404));

    try { await deleteMultipleFromCloudinary([image.publicId]); } catch (e) {}
    image.deleteOne();

    if (product.images.length > 0 && !product.images.some((img) => img.isMain)) {
      product.images[0].isMain = true;
    }

    await product.save();
    res.json({ success: true, message: 'Image deleted', data: { images: product.images } });
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));

    if (product.images.length > 0) {
      const publicIds = product.images.map((img) => img.publicId).filter(Boolean);
      try { await deleteMultipleFromCloudinary(publicIds); } catch (e) {}
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
};

exports.updateInventory = async (req, res, next) => {
  try {
    const { stock, variantId } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));

    if (variantId) {
      const variant = product.variants.id(variantId);
      if (!variant) return next(new AppError('Variant not found', 404));
      variant.stock = stock;
    } else {
      product.stock = stock;
    }

    await product.save();
    res.json({ success: true, message: 'Inventory updated', data: { product } });
  } catch (err) { next(err); }
};

exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      trackInventory: true,
      $or: [
        { stock: { $lte: 5, $gt: 0 } },
        { stock: 0 },
      ],
    }).select('name sku stock lowStockThreshold images price').sort('stock');

    res.json({ success: true, data: { products } });
  } catch (err) { next(err); }
};

// Admin: Get all products including inactive
exports.adminGetProducts = async (req, res, next) => {
  try {
    const features = new APIFeatures(
      Product.find().populate('category', 'name'),
      req.query
    ).filter().search(['name', 'sku']).sort().paginate();

    const [products, total] = await Promise.all([
      features.query,
      Product.countDocuments(),
    ]);

    const { page, limit } = features.paginationInfo;
    res.json({
      success: true,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      data: { products },
    });
  } catch (err) { next(err); }
};

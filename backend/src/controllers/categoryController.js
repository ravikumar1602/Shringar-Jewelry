'use strict';

const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const { deleteFromCloudinary } = require('../config/cloudinary');

exports.getCategories = async (req, res, next) => {
  try {
    const { includeInactive, parent } = req.query;
    const query = {};
    if (!includeInactive) query.isActive = true;
    if (parent === 'null') query.parent = null;
    else if (parent) query.parent = parent;

    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .populate('productCount')
      .sort('sortOrder name');

    res.json({ success: true, data: { categories } });
  } catch (err) { next(err); }
};

exports.getCategory = async (req, res, next) => {
  try {
    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/) ? { _id: req.params.id } : { slug: req.params.id };
    const category = await Category.findOne(query).populate('parent', 'name slug').populate('productCount');
    if (!category) return next(new AppError('Category not found', 404));
    res.json({ success: true, data: { category } });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const imageData = req.file ? { url: req.file.path, publicId: req.file.filename } : undefined;
    const category = await Category.create({ ...req.body, ...(imageData && { image: imageData }) });
    res.status(201).json({ success: true, message: 'Category created', data: { category } });
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new AppError('Category not found', 404));

    if (req.file) {
      if (category.image?.publicId) {
        try { await deleteFromCloudinary(category.image.publicId); } catch {}
      }
      req.body.image = { url: req.file.path, publicId: req.file.filename };
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Category updated', data: { category: updated } });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new AppError('Category not found', 404));

    const Product = require('../models/Product');
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) return next(new AppError(`Cannot delete category with ${productCount} products. Move or delete them first.`, 400));

    if (category.image?.publicId) {
      try { await deleteFromCloudinary(category.image.publicId); } catch {}
    }
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};

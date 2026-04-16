'use strict';

const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [60, 'Category name too long'],
  },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, trim: true, maxlength: [500, 'Description too long'] },
  image: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  metaTitle: { type: String, trim: true },
  metaDescription: { type: String, trim: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });

// Virtual: product count
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;

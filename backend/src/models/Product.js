'use strict';

const mongoose = require('mongoose');
const slugify = require('slugify');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  alt: { type: String, default: '' },
  isMain: { type: Boolean, default: false },
}, { _id: true });

const variantSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true }, // e.g., "Gold 18K", "Silver"
  sku: { type: String, required: true, uppercase: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  weight: { type: Number }, // grams
  attributes: { type: Map, of: String }, // { karat: "18K", color: "yellow" }
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [200, 'Name cannot exceed 200 characters'],
  },
  slug: { type: String, unique: true, lowercase: true },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [5000, 'Description too long'],
  },
  shortDescription: { type: String, maxlength: [500, 'Short description too long'] },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  images: {
    type: [imageSchema],
    validate: [(arr) => arr.length <= 8, 'Maximum 8 images allowed'],
  },
  variants: [variantSchema],

  // Primary pricing (when no variants)
  price: { type: Number, min: [0, 'Price cannot be negative'] },
  comparePrice: { type: Number, min: 0 },
  sku: { type: String, uppercase: true, trim: true, sparse: true },

  // Inventory
  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  trackInventory: { type: Boolean, default: true },

  // Jewelry-specific fields
  material: {
    type: String,
    enum: ['gold', 'silver', 'platinum', 'rose_gold', 'stainless_steel', 'brass', 'copper', 'other'],
  },
  purity: { type: String, trim: true }, // 18K, 22K, 925, etc.
  gemstone: { type: String, trim: true }, // Diamond, Ruby, etc.
  weight: { type: Number, min: 0 }, // in grams
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, default: 'mm' },
  },
  gender: { type: String, enum: ['men', 'women', 'unisex', 'kids'], default: 'unisex' },
  occasion: [{ type: String, enum: ['wedding', 'casual', 'festive', 'office', 'party'] }],

  // Ratings & Reviews
  ratingsAverage: { type: Number, default: 0, min: 0, max: 5, set: (v) => Math.round(v * 10) / 10 },
  ratingsCount: { type: Number, default: 0 },

  // SEO
  metaTitle: { type: String, trim: true },
  metaDescription: { type: String, trim: true },
  tags: [{ type: String, lowercase: true, trim: true }],

  // Status
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isNew: { type: Boolean, default: true },
  isBestseller: { type: Boolean, default: false },

  // Stats
  viewCount: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },

  // Management tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
productSchema.index({ slug: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ isActive: 1, isFeatured: -1, createdAt: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' }, { weights: { name: 10, tags: 5, description: 1 } });
productSchema.index({ material: 1, gender: 1 });

// Virtuals
productSchema.virtual('isInStock').get(function () {
  if (this.variants?.length > 0) {
    return this.variants.some((v) => v.stock > 0);
  }
  return this.stock > 0;
});

productSchema.virtual('isLowStock').get(function () {
  if (!this.trackInventory) return false;
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

productSchema.virtual('discountPercent').get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

productSchema.virtual('mainImage').get(function () {
  if (!this.images?.length) return null;
  return this.images.find((img) => img.isMain) || this.images[0];
});

// Pre-save slug
productSchema.pre('save', async function (next) {
  if (!this.isModified('name')) return next();
  let slug = slugify(this.name, { lower: true, strict: true });
  const existing = await this.constructor.findOne({ slug, _id: { $ne: this._id } });
  if (existing) slug = `${slug}-${Date.now()}`;
  this.slug = slug;
  next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;

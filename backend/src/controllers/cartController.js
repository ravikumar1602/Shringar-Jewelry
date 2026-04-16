'use strict';

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const AppError = require('../utils/AppError');

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name images price comparePrice stock isActive trackInventory variants');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Remove items with deleted/inactive products
    const validItems = cart.items.filter((item) => item.product && item.product.isActive);
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.json({ success: true, data: { cart } });
  } catch (err) { next(err); }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, variantId } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) return next(new AppError('Product not available', 404));

    let price = product.price;
    let stockAvailable = product.stock;

    if (variantId) {
      const variant = product.variants.id(variantId);
      if (!variant) return next(new AppError('Variant not found', 404));
      price = variant.price;
      stockAvailable = variant.stock;
    }

    if (product.trackInventory && stockAvailable < quantity) {
      return next(new AppError(`Only ${stockAvailable} items available in stock`, 400));
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const existingItem = cart.items.find((item) =>
      item.product.toString() === productId &&
      String(item.variantId || '') === String(variantId || '')
    );

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > 10) return next(new AppError('Maximum 10 units per item allowed', 400));
      if (product.trackInventory && newQty > stockAvailable) {
        return next(new AppError(`Only ${stockAvailable} items available`, 400));
      }
      existingItem.quantity = newQty;
    } else {
      const mainImage = product.images?.find((img) => img.isMain) || product.images?.[0];
      cart.items.push({
        product: productId,
        variantId: variantId || null,
        quantity,
        price,
        name: product.name,
        image: mainImage?.url || '',
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name images price stock isActive');
    res.json({ success: true, message: 'Added to cart', data: { cart } });
  } catch (err) { next(err); }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return next(new AppError('Cart not found', 404));

    const item = cart.items.id(req.params.itemId);
    if (!item) return next(new AppError('Cart item not found', 404));

    if (quantity === 0) {
      item.deleteOne();
    } else {
      const product = await Product.findById(item.product);
      if (product?.trackInventory && quantity > product.stock) {
        return next(new AppError(`Only ${product.stock} items available`, 400));
      }
      item.quantity = Math.min(10, Math.max(1, quantity));
    }

    await cart.save();
    await cart.populate('items.product', 'name images price stock isActive');
    res.json({ success: true, message: 'Cart updated', data: { cart } });
  } catch (err) { next(err); }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return next(new AppError('Cart not found', 404));

    const item = cart.items.id(req.params.itemId);
    if (!item) return next(new AppError('Item not found in cart', 404));

    item.deleteOne();
    await cart.save();
    res.json({ success: true, message: 'Item removed from cart', data: { cart } });
  } catch (err) { next(err); }
};

exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], couponCode: null, couponDiscount: 0 }
    );
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) { next(err); }
};

exports.applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) return next(new AppError('Cart is empty', 400));

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return next(new AppError('Invalid coupon code', 400));

    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const { valid, message } = coupon.isValid(subtotal, req.user._id);
    if (!valid) return next(new AppError(message, 400));

    const discount = coupon.calculateDiscount(subtotal);
    cart.couponCode = coupon.code;
    cart.couponDiscount = discount;
    await cart.save();

    res.json({
      success: true,
      message: `Coupon applied! You saved ₹${discount}`,
      data: { cart, discount, couponCode: coupon.code },
    });
  } catch (err) { next(err); }
};

exports.removeCoupon = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { couponCode: null, couponDiscount: 0 }
    );
    res.json({ success: true, message: 'Coupon removed' });
  } catch (err) { next(err); }
};

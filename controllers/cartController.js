const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc  Get cart
// @route GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name price discountPrice images fitType');
  res.json({ success: true, cart: cart || { items: [] } });
});

// @desc  Add to cart
// @route POST /api/cart
const addToCart = asyncHandler(async (req, res) => {
  const { productId, size, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const sizeObj = product.sizes.find((s) => s.size === size);
  if (!sizeObj || sizeObj.stock < quantity) {
    res.status(400);
    throw new Error('Selected size is out of stock');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const existingItem = cart.items.find((i) => i.product.toString() === productId && i.size === size);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ product: productId, size, quantity });
  }
  await cart.save();
  await cart.populate('items.product', 'name price discountPrice images fitType');
  res.json({ success: true, cart });
});

// @desc  Update cart item
// @route PUT /api/cart/:itemId
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }
  const item = cart.items.id(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error('Item not found in cart');
  }
  if (quantity <= 0) {
    cart.items.pull(req.params.itemId);
  } else {
    item.quantity = quantity;
  }
  await cart.save();
  await cart.populate('items.product', 'name price discountPrice images fitType');
  res.json({ success: true, cart });
});

// @desc  Remove from cart
// @route DELETE /api/cart/:itemId
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }
  cart.items.pull(req.params.itemId);
  await cart.save();
  res.json({ success: true, message: 'Item removed from cart' });
});

// @desc  Clear cart
// @route DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.json({ success: true, message: 'Cart cleared' });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };

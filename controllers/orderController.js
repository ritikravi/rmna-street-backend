const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const sendEmail = require('../utils/sendEmail');
const { orderConfirmationEmail, orderStatusUpdateEmail } = require('../utils/emailTemplates');

// @desc  Place order
// @route POST /api/orders
const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, couponCode, paymentMethod } = req.body;
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  // Validate stock and build order items
  const orderItems = [];
  let itemsPrice = 0;
  for (const item of cart.items) {
    const product = item.product;
    const sizeObj = product.sizes.find((s) => s.size === item.size);
    if (!sizeObj || sizeObj.stock < item.quantity) {
      res.status(400);
      throw new Error(`${product.name} (size ${item.size}) is out of stock`);
    }
    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    itemsPrice += price * item.quantity;
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || '',
      price,
      size: item.size,
      quantity: item.quantity,
    });
  }

  // Apply coupon
  let discountAmount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon || coupon.expiresAt < Date.now() || coupon.usedCount >= coupon.usageLimit) {
      res.status(400);
      throw new Error('Invalid or expired coupon');
    }
    if (itemsPrice < coupon.minOrderAmount) {
      res.status(400);
      throw new Error(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`);
    }
    discountAmount =
      coupon.discountType === 'percentage'
        ? Math.min((itemsPrice * coupon.discountValue) / 100, coupon.maxDiscount || Infinity)
        : coupon.discountValue;
    coupon.usedCount += 1;
    await coupon.save();
  }

  const shippingPrice = 0; // Free shipping on all orders
  const totalPrice = itemsPrice + shippingPrice - discountAmount;

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'COD',
    itemsPrice,
    shippingPrice,
    discountAmount,
    totalPrice,
    couponCode,
    statusHistory: [{ status: 'Pending' }],
  });

  // Deduct stock
  for (const item of cart.items) {
    await Product.updateOne(
      { _id: item.product._id, 'sizes.size': item.size },
      { $inc: { 'sizes.$.stock': -item.quantity } }
    );
  }

  // Clear cart
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  // Populate order with full details for email
  const populatedOrder = await Order.findById(order._id).populate('orderItems.product');

  // Send order confirmation email
  try {
    await sendEmail({
      to: req.user.email,
      subject: `Order Confirmed #${order._id.toString().slice(-8).toUpperCase()} - RMNA Street`,
      html: orderConfirmationEmail(populatedOrder, req.user),
    });
    console.log(`✅ Order confirmation email sent to ${req.user.email}`);
  } catch (emailError) {
    console.error('❌ Failed to send order confirmation email:', emailError.message);
    // Don't fail the order if email fails
  }

  res.status(201).json({ success: true, order });
});

// @desc  Get my orders
// @route GET /api/orders/my
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// @desc  Get single order
// @route GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  res.json({ success: true, order });
});

// @desc  Cancel order
// @route PUT /api/orders/:id/cancel
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  if (!['Pending', 'Confirmed'].includes(order.orderStatus)) {
    res.status(400);
    throw new Error('Order cannot be cancelled at this stage');
  }
  order.orderStatus = 'Cancelled';
  order.statusHistory.push({ status: 'Cancelled', note: req.body.reason || 'Cancelled by user' });

  // Restore stock
  for (const item of order.orderItems) {
    await Product.updateOne(
      { _id: item.product, 'sizes.size': item.size },
      { $inc: { 'sizes.$.stock': item.quantity } }
    );
  }
  await order.save();

  // Send cancellation email
  try {
    const user = await require('../models/User').findById(order.user);
    await sendEmail({
      to: user.email,
      subject: `Order Cancelled #${order._id.toString().slice(-8).toUpperCase()} - RMNA Street`,
      html: orderStatusUpdateEmail(order, user, 'cancelled'),
    });
    console.log(`✅ Order cancellation email sent to ${user.email}`);
  } catch (emailError) {
    console.error('❌ Failed to send cancellation email:', emailError.message);
  }

  res.json({ success: true, order });
});

// @desc  Validate coupon
// @route POST /api/orders/validate-coupon
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon || coupon.expiresAt < Date.now() || coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error('Invalid or expired coupon');
  }
  if (orderAmount < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order amount is ₹${coupon.minOrderAmount}`);
  }
  const discount =
    coupon.discountType === 'percentage'
      ? Math.min((orderAmount * coupon.discountValue) / 100, coupon.maxDiscount || Infinity)
      : coupon.discountValue;
  res.json({ success: true, discount, coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue } });
});

module.exports = { placeOrder, getMyOrders, getOrder, cancelOrder, validateCoupon };

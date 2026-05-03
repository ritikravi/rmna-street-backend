const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// @desc  Dashboard stats
// @route GET /api/admin/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const [totalOrders, totalUsers, totalProducts, revenueData, recentOrders, ordersByStatus] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    stats: {
      totalOrders,
      totalUsers,
      totalProducts,
      revenue: revenueData[0]?.total || 0,
    },
    recentOrders,
    ordersByStatus,
  });
});

// @desc  Get all orders (admin)
// @route GET /api/admin/orders
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { orderStatus: status } : {};
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('user', 'name email');
  res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
});

// @desc  Update order status (admin)
// @route PUT /api/admin/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  order.orderStatus = status;
  order.statusHistory.push({ status, note });
  if (status === 'Delivered') order.deliveredAt = new Date();
  await order.save();
  res.json({ success: true, order });
});

// @desc  Get all users (admin)
// @route GET /api/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
  res.json({ success: true, users });
});

// @desc  Create coupon (admin)
// @route POST /api/admin/coupons
const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
});

// @desc  Get all coupons (admin)
// @route GET /api/admin/coupons
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

// @desc  Delete coupon (admin)
// @route DELETE /api/admin/coupons/:id
const deleteCoupon = asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Coupon deleted' });
});

module.exports = { getDashboard, getAllOrders, updateOrderStatus, getAllUsers, createCoupon, getCoupons, deleteCoupon };

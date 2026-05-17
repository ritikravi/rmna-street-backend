const asyncHandler = require('express-async-handler');
const NotificationSubscription = require('../models/NotificationSubscription');
const Product = require('../models/Product');

// @desc  Subscribe to back-in-stock notifications
// @route POST /api/notifications/subscribe
const subscribeToNotification = asyncHandler(async (req, res) => {
  const { productId, email } = req.body;

  if (!productId || !email) {
    res.status(400);
    throw new Error('Product ID and email are required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Invalid email format');
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  try {
    const subscription = await NotificationSubscription.create({
      product: productId,
      email: email.toLowerCase().trim()
    });

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to notifications',
      subscription
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      res.status(400);
      throw new Error('You are already subscribed to notifications for this product');
    }
    throw error;
  }
});

// @desc  Check if user is subscribed to product notifications
// @route POST /api/notifications/check-subscription
const checkSubscription = asyncHandler(async (req, res) => {
  const { productId, email } = req.body;

  if (!productId || !email) {
    res.status(400);
    throw new Error('Product ID and email are required');
  }

  const subscription = await NotificationSubscription.findOne({
    product: productId,
    email: email.toLowerCase().trim(),
    notified: false
  });

  res.json({
    success: true,
    isSubscribed: !!subscription
  });
});

module.exports = {
  subscribeToNotification,
  checkSubscription
};

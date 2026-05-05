const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Feedback = require('../models/Feedback');
const { protect, admin } = require('../middleware/authMiddleware');

// Submit feedback (public)
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, type, message, rating } = req.body;
  if (!name || !email || !message) { res.status(400); throw new Error('Name, email and message required'); }
  const feedback = await Feedback.create({ name, email, type, message, rating });
  res.status(201).json({ success: true, message: 'Feedback submitted. Thank you!', feedback });
}));

// Get all feedback (admin)
router.get('/', protect, admin, asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find().sort({ createdAt: -1 });
  res.json({ success: true, feedbacks });
}));

// Mark as read (admin)
router.put('/:id/read', protect, admin, asyncHandler(async (req, res) => {
  await Feedback.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
}));

module.exports = router;

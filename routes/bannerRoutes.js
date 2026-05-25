const express = require('express');
const router = express.Router();
const {
  getActiveBanner,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus
} = require('../controllers/bannerController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route
router.get('/active', getActiveBanner);

// Admin routes
router.get('/', protect, admin, getAllBanners);
router.post('/', protect, admin, createBanner);
router.put('/:id', protect, admin, updateBanner);
router.delete('/:id', protect, admin, deleteBanner);
router.patch('/:id/toggle', protect, admin, toggleBannerStatus);

module.exports = router;

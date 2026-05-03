const express = require('express');
const router = express.Router();
const { getDashboard, getAllOrders, updateOrderStatus, getAllUsers, createCoupon, getCoupons, deleteCoupon } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);

router.get('/dashboard', getDashboard);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/users', getAllUsers);
router.post('/coupons', createCoupon);
router.get('/coupons', getCoupons);
router.delete('/coupons/:id', deleteCoupon);

module.exports = router;

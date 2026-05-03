const express = require('express');
const router = express.Router();
const { placeOrder, getMyOrders, getOrder, cancelOrder, validateCoupon } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, placeOrder);
router.get('/my', protect, getMyOrders);
router.post('/validate-coupon', protect, validateCoupon);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;

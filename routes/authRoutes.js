const express = require('express');
const router = express.Router();
const { register, verifyOtp, resendOtp, login, googleLogin, getProfile, updateProfile, addAddress, deleteAddress, getEarlyAccessCoupon } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/address', protect, addAddress);
router.delete('/address/:id', protect, deleteAddress);
router.get('/early-access-coupon', protect, getEarlyAccessCoupon);

module.exports = router;

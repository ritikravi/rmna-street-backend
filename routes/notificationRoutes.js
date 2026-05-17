const express = require('express');
const router = express.Router();
const { subscribeToNotification, checkSubscription } = require('../controllers/notificationController');

router.post('/subscribe', subscribeToNotification);
router.post('/check-subscription', checkSubscription);

module.exports = router;

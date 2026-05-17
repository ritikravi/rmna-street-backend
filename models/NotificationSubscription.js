const mongoose = require('mongoose');

const notificationSubscriptionSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Email validation regex
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 2592000 // Auto-delete after 30 days if not notified
  },
  notified: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Compound unique index to prevent duplicate subscriptions
notificationSubscriptionSchema.index(
  { product: 1, email: 1 }, 
  { unique: true }
);

// Index for efficient queries
notificationSubscriptionSchema.index({ product: 1, notified: 1 });

module.exports = mongoose.model('NotificationSubscription', notificationSubscriptionSchema);

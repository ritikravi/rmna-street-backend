const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 }, // Changed from minOrderAmount
    minOrderAmount: { type: Number, default: 0 }, // Keep for backward compatibility
    maxDiscount: { type: Number },
    maxUses: { type: Number, default: 100 }, // Changed from usageLimit
    usageLimit: { type: Number, default: 100 }, // Keep for backward compatibility
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Added for early access tracking
    description: { type: String }, // Added for coupon description
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);

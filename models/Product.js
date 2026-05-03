const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: 0 },
    images: [{ public_id: String, url: String }],
    category: { type: String, default: 'jeans' },
    fitType: { type: String, enum: ['straight', 'baggy', 'slim', 'regular'], required: true },
    sizes: [
      {
        size: { type: String, enum: ['28', '30', '32', '34', '36', '38'] },
        stock: { type: Number, default: 0 },
      },
    ],
    totalStock: { type: Number, default: 0 },
    tags: [String],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    reviews: [reviewSchema],
    numReviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Update totalStock before save
productSchema.pre('save', function (next) {
  this.totalStock = this.sizes.reduce((acc, s) => acc + s.stock, 0);
  next();
});

// Text index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);

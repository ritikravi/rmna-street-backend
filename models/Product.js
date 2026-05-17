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
    subcategory: { type: String }, // For women-accessories: earrings, nose-rings, rings, minimal-jewellery
    fitType: { type: String, enum: ['straight', 'baggy', 'slim', 'regular'] }, // Optional for accessories
    sizes: [
      {
        size: { type: String, enum: ['28', '30', '32', '34', '36', '38', 'one-size', 'free-size', '6', '7', '8', '9', '10', '26', 'S', 'M', 'L', 'XL', 'XXL'] },
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
    // NEW FIELDS FOR ADVANCED FEATURES
    color: { 
      type: String, 
      required: true,
      default: 'black',
      enum: ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'gray', 'brown', 'beige', 'navy', 'maroon', 'olive', 'orange', 'multicolor']
    },
    brand: { 
      type: String, 
      required: true,
      default: 'RMNA',
      trim: true
    },
    sizeGuide: {
      category: { 
        type: String,
        enum: ['mens-shirts', 'womens-jeans', 'girls-kurti', 'girls-jeans', 'womens-accessories']
      },
      measurements: [{
        size: String,
        chest: Number,
        waist: Number,
        hip: Number,
        length: Number
      }]
    },
    highResImages: [{ 
      public_id: String, 
      url: String 
    }]
  },
  { timestamps: true }
);

// Update totalStock before save
productSchema.pre('save', function (next) {
  if (this.sizes && this.sizes.length > 0) {
    this.totalStock = this.sizes.reduce((acc, s) => acc + s.stock, 0);
  }
  next();
});

// Text index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Indexes for filtering
productSchema.index({ color: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ color: 1, brand: 1, price: 1 }); // Compound index for multi-filter queries

module.exports = mongoose.model('Product', productSchema);

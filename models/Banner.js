const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  buttonText: {
    type: String,
    default: 'Shop Now'
  },
  buttonLink: {
    type: String,
    default: '/products'
  },
  // Filter settings for products
  minDiscountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  targetCategories: [{
    type: String,
    enum: ['jeans', 'mens-shirts', 'girls-jeans', 'girls-kurti', 'women-accessories']
  }],
  targetGender: {
    type: String,
    enum: ['all', 'men', 'women', 'girls'],
    default: 'all'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  backgroundColor: {
    type: String,
    default: 'from-zinc-900 to-zinc-700'
  },
  textColor: {
    type: String,
    default: 'text-white'
  },
  highlightColor: {
    type: String,
    default: 'text-red-400'
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);

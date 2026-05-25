const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const NotificationSubscription = require('../models/NotificationSubscription');
const { cloudinary, hasCloudinary } = require('../config/cloudinary');
const { sendEmail } = require('../utils/sendEmail');
const { backInStockEmail } = require('../utils/emailTemplates');

// Helper: build image objects from uploaded files
const buildImages = (files) => {
  if (!files || files.length === 0) return [];
  if (hasCloudinary) {
    return files.map((f) => ({ public_id: f.filename, url: f.path }));
  }
  // No cloudinary — store a placeholder (swap later when cloudinary is set up)
  return files.map((f) => ({
    public_id: `local_${Date.now()}`,
    url: `https://placehold.co/400x533?text=RMNA`,
  }));
};

// @desc  Get all products with filters
// @route GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const { keyword, size, minPrice, maxPrice, fitType, category, subcategory, sort, page = 1, limit = 12, featured, discounted, color, brand, minDiscount, gender, categories } = req.query;
  const query = { isActive: true };

  if (keyword) query.$text = { $search: keyword };
  if (category) query.category = category;
  if (subcategory) query.subcategory = subcategory;
  if (fitType) query.fitType = fitType;
  if (featured === 'true') query.isFeatured = true;
  if (discounted === 'true') query.discountPrice = { $gt: 0 };
  if (size) query['sizes.size'] = size;
  
  // NEW: Color filter
  if (color) query.color = color;
  
  // NEW: Brand filter (supports multiple brands)
  if (brand) {
    const brands = brand.split(',').map(b => b.trim());
    query.brand = { $in: brands };
  }
  
  // NEW: Gender filter (maps to category)
  if (gender && gender !== 'all') {
    if (gender === 'men') {
      query.category = { $in: ['jeans', 'shirts'] };
    } else if (gender === 'women') {
      query.category = 'accessories';
    } else if (gender === 'girls') {
      query.category = { $in: ['girls-jeans', 'girls-kurti'] };
    }
  }
  
  // NEW: Categories filter (from banner)
  if (categories) {
    const categoryList = categories.split(',').map(c => c.trim());
    query.category = { $in: categoryList };
  }
  
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { rating: -1 },
  };
  const sortBy = sortOptions[sort] || { createdAt: -1 };

  const total = await Product.countDocuments(query);
  let products = await Product.find(query)
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .select('-reviews');

  // NEW: Filter by minimum discount percentage (post-query filter)
  if (minDiscount && Number(minDiscount) > 0) {
    const minDiscountPercent = Number(minDiscount);
    products = products.filter(product => {
      if (product.discountPrice > 0 && product.price > 0) {
        const discountPercent = Math.round(((product.price - product.discountPrice) / product.price) * 100);
        return discountPercent >= minDiscountPercent;
      }
      return false;
    });
  }

  res.json({
    success: true,
    products,
    page: Number(page),
    pages: Math.ceil(total / limit),
    total: products.length, // Update total to reflect filtered count
  });
});

// @desc  Get single product
// @route GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('reviews.user', 'name');
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

// @desc  Create product (admin)
// @route POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, discountPrice, category, subcategory, fitType, sizes, tags, isFeatured } = req.body;
  const images = buildImages(req.files);
  const product = await Product.create({
    name,
    description,
    price: Number(price),
    discountPrice: Number(discountPrice) || 0,
    category: category || 'jeans',
    subcategory,
    fitType,
    sizes: JSON.parse(sizes || '[]'),
    tags: tags ? tags.split(',').map((t) => t.trim()) : [],
    isFeatured: isFeatured === 'true',
    images,
  });
  res.status(201).json({ success: true, product });
});

// @desc  Update product (admin)
// @route PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Track old stock for notification trigger
  const oldStock = product.totalStock;
  
  const { name, description, price, discountPrice, category, subcategory, fitType, sizes, tags, isFeatured, isActive, color, brand, sizeGuide, highResImages } = req.body;
  if (name) product.name = name;
  if (description) product.description = description;
  if (price) product.price = Number(price);
  if (discountPrice !== undefined) product.discountPrice = Number(discountPrice);
  if (category) product.category = category;
  if (subcategory !== undefined) product.subcategory = subcategory;
  if (fitType) product.fitType = fitType;
  if (sizes) product.sizes = JSON.parse(sizes);
  if (tags) product.tags = tags.split(',').map((t) => t.trim());
  if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true';
  if (isActive !== undefined) product.isActive = isActive === 'true';
  if (color) product.color = color;
  if (brand) product.brand = brand;
  if (sizeGuide) product.sizeGuide = JSON.parse(sizeGuide);

  // Add new images if uploaded
  if (req.files?.length) {
    const newImages = buildImages(req.files);
    product.images.push(...newImages);
  }

  await product.save();
  
  // NEW: Trigger stock notifications if stock changed from 0 to >0
  const newStock = product.totalStock;
  if (oldStock === 0 && newStock > 0) {
    triggerStockNotifications(product._id).catch(console.error);
  }
  
  res.json({ success: true, product });
});

// @desc  Delete product image (admin)
// @route DELETE /api/products/:id/image/:publicId
const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  await cloudinary.uploader.destroy(req.params.publicId);
  product.images = product.images.filter((img) => img.public_id !== req.params.publicId);
  await product.save();
  res.json({ success: true, message: 'Image deleted' });
});

// @desc  Delete product (admin)
// @route DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  // Delete images from cloudinary
  for (const img of product.images) {
    if (hasCloudinary) await cloudinary.uploader.destroy(img.public_id).catch(console.error);
  }
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

// @desc  Get filter metadata (available colors, brands, price range)
// @route GET /api/products/filters
const getFilterMetadata = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const query = { isActive: true };
  if (category) query.category = category;

  const products = await Product.find(query).select('color brand price');
  
  const colors = [...new Set(products.map(p => p.color).filter(Boolean))];
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
  const prices = products.map(p => p.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 10000;

  res.json({
    success: true,
    filters: {
      colors: colors.sort(),
      brands: brands.sort(),
      priceRange: { min: minPrice, max: maxPrice }
    }
  });
});

// Helper: Trigger stock notifications
async function triggerStockNotifications(productId) {
  try {
    const product = await Product.findById(productId);
    if (!product) return;

    const subscriptions = await NotificationSubscription.find({ 
      product: productId, 
      notified: false 
    });

    console.log(`📧 Sending ${subscriptions.length} back-in-stock notifications for ${product.name}`);

    for (const subscription of subscriptions) {
      try {
        await sendEmail(backInStockEmail(product, subscription.email));
        await NotificationSubscription.findByIdAndDelete(subscription._id);
        console.log(`✅ Notification sent to ${subscription.email}`);
      } catch (error) {
        console.error(`❌ Failed to send notification to ${subscription.email}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error triggering stock notifications:', error);
  }
}

module.exports = { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  deleteProductImage,
  getFilterMetadata 
};

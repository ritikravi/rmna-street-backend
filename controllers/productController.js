const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const { cloudinary, hasCloudinary } = require('../config/cloudinary');

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
  const { keyword, size, minPrice, maxPrice, fitType, sort, page = 1, limit = 12, featured } = req.query;
  const query = { isActive: true };

  if (keyword) query.$text = { $search: keyword };
  if (fitType) query.fitType = fitType;
  if (featured === 'true') query.isFeatured = true;
  if (size) query['sizes.size'] = size;
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
  const products = await Product.find(query)
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .select('-reviews');

  res.json({
    success: true,
    products,
    page: Number(page),
    pages: Math.ceil(total / limit),
    total,
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
  const { name, description, price, discountPrice, fitType, sizes, tags, isFeatured } = req.body;
  const images = buildImages(req.files);
  const product = await Product.create({
    name,
    description,
    price: Number(price),
    discountPrice: Number(discountPrice) || 0,
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
  const { name, description, price, discountPrice, fitType, sizes, tags, isFeatured, isActive } = req.body;
  if (name) product.name = name;
  if (description) product.description = description;
  if (price) product.price = Number(price);
  if (discountPrice !== undefined) product.discountPrice = Number(discountPrice);
  if (fitType) product.fitType = fitType;
  if (sizes) product.sizes = JSON.parse(sizes);
  if (tags) product.tags = tags.split(',').map((t) => t.trim());
  if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true';
  if (isActive !== undefined) product.isActive = isActive === 'true';

  // Add new images if uploaded
  if (req.files?.length) {
    const newImages = buildImages(req.files);
    product.images.push(...newImages);
  }

  await product.save();
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

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, deleteProductImage };

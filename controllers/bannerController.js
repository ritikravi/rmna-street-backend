const Banner = require('../models/Banner');

// Get active banner (public)
exports.getActiveBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({ isActive: true }).sort({ order: -1 });
    if (!banner) {
      return res.status(200).json({ banner: null });
    }
    res.status(200).json({ banner });
  } catch (error) {
    console.error('Get active banner error:', error);
    res.status(500).json({ message: 'Failed to fetch banner' });
  }
};

// Get all banners (admin)
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: -1, createdAt: -1 });
    res.status(200).json({ banners });
  } catch (error) {
    console.error('Get all banners error:', error);
    res.status(500).json({ message: 'Failed to fetch banners' });
  }
};

// Create banner (admin)
exports.createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ message: 'Banner created successfully', banner });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ message: 'Failed to create banner' });
  }
};

// Update banner (admin)
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.status(200).json({ message: 'Banner updated successfully', banner });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ message: 'Failed to update banner' });
  }
};

// Delete banner (admin)
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ message: 'Failed to delete banner' });
  }
};

// Toggle banner active status (admin)
exports.toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    // If activating this banner, deactivate all others
    if (!banner.isActive) {
      await Banner.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
    }
    
    banner.isActive = !banner.isActive;
    await banner.save();
    
    res.status(200).json({ message: 'Banner status updated', banner });
  } catch (error) {
    console.error('Toggle banner status error:', error);
    res.status(500).json({ message: 'Failed to toggle banner status' });
  }
};

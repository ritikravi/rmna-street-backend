const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      res.status(401);
      throw new Error('User not found');
    }
    
    // Log IP for security monitoring
    req.userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

const admin = (req, res, next) => {
  if (req.user?.role === 'admin') {
    // Log admin access
    console.log(`[ADMIN ACCESS] ${req.user.email} from ${req.userIp} - ${req.method} ${req.originalUrl}`);
    return next();
  }
  
  // Log unauthorized admin access attempts
  console.warn(`[UNAUTHORIZED ADMIN ATTEMPT] ${req.user?.email || 'Unknown'} from ${req.userIp}`);
  res.status(403);
  throw new Error('Admin access required');
};

module.exports = { protect, admin };

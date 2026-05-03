/**
 * Run: node utils/seedAdmin.js
 * Creates the initial admin user
 */
const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const exists = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (exists) {
    console.log('Admin already exists');
    process.exit(0);
  }
  await User.create({
    name: 'Admin',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
    isVerified: true,
  });
  console.log('Admin created successfully');
  process.exit(0);
};

seed().catch((e) => { console.error(e); process.exit(1); });

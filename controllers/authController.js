const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const otpEmailHtml = (name, otp) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#000000;padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:6px;font-weight:900;">RMNA</h1>
            <p style="margin:4px 0 0;color:#BB0000;font-size:10px;letter-spacing:4px;text-transform:uppercase;">Built Different</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#666;font-size:14px;">Hey ${name},</p>
            <h2 style="margin:0 0 24px;color:#000;font-size:22px;">Verify your email</h2>
            <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
              Use the OTP below to verify your RMNA Street account. Valid for <strong>10 minutes</strong>.
            </p>
            <!-- OTP Box -->
            <div style="background:#f8f8f8;border:2px dashed #BB0000;border-radius:4px;padding:24px;text-align:center;margin:0 0 24px;">
              <p style="margin:0 0 4px;color:#999;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Your OTP</p>
              <p style="margin:0;color:#000;font-size:42px;font-weight:900;letter-spacing:12px;">${otp}</p>
            </div>
            <p style="margin:0;color:#999;font-size:12px;">
              If you didn't create an account, ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#bbb;font-size:11px;">© ${new Date().getFullYear()} RMNA Street. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// @desc  Register user
// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error('Email already registered'); }

  const otp = generateOtp();
  const user = await User.create({
    name, email, password, phone,
    otp,
    otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
  });

  sendEmail({
    to: email,
    subject: 'Your RMNA Street verification code',
    html: otpEmailHtml(name, otp),
  }).then(() => console.log('OTP email sent to', email))
    .catch((err) => console.error('Email send error:', err.message));

  res.status(201).json({
    success: true,
    message: 'OTP sent to your email.',
    token: generateToken(user._id),
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
  });
});

// @desc  Verify OTP
// @route POST /api/auth/verify-otp
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();
  res.json({ success: true, message: 'Email verified successfully' });
});

// @desc  Resend OTP
// @route POST /api/auth/resend-otp
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.isVerified) { res.status(400); throw new Error('Email already verified'); }

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  sendEmail({
    to: email,
    subject: 'Your RMNA Street verification code',
    html: otpEmailHtml(user.name, otp),
  }).then(() => console.log('OTP resent to', email))
    .catch((err) => console.error('Resend email error:', err.message));

  res.json({ success: true, message: 'OTP resent to your email' });
});

// @desc  Login user
// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  res.json({
    success: true,
    token: generateToken(user._id),
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
  });
});

// @desc  Get profile
// @route GET /api/auth/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -otp -otpExpiry');
  res.json({ success: true, user });
});

// @desc  Update profile
// @route PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, phone, password } = req.body;
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (password) user.password = password;
  await user.save();
  res.json({ success: true, message: 'Profile updated', user: { _id: user._id, name: user.name, email: user.email } });
});

// @desc  Add address
// @route POST /api/auth/address
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
});

// @desc  Delete address
// @route DELETE /api/auth/address/:id
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.id);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

module.exports = { register, verifyOtp, resendOtp, login, getProfile, updateProfile, addAddress, deleteAddress };

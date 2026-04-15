const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const generateToken = (user) => {
  const payload = { id: user._id, email: user.email, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Step 2: Auth Controllers Refactored

// Send OTP for Signup
exports.sendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'User already exists and is verified' });
    }

    if (!user) {
      user = await User.create({ email, name: email.split('@')[0] });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send email asynchronously (don't wait for it)
    transporter.sendMail({
      from: `"Codec Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Codec Signup Verification Code',
      text: `Your Codec Signup Code is: ${otp}\n\nThis code expires in 10 minutes.`
    }).catch(err => console.error('[EMAIL] Signup OTP send error:', err));

    // Respond immediately
    res.status(200).json({ message: 'Signup OTP sent successfully' });
  } catch (error) {
    console.error('[AUTH] Signup OTP Error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Register and Set Password
exports.registerAndSetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = password; // Hashing handled by userSchema.pre('save')
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    // Explicitly set role if not present
    if (!user.role) user.role = 'Professor';

    await user.save();

    const token = generateToken(user);
    // Convert to object and remove password for security
    const { password: _, otp: __, otpExpires: ___, ...userData } = user.toObject();
    res.status(200).json({ message: 'Account verified and created successfully', user: userData, token });
  } catch (error) {
    console.error('[AUTH] Register Error:', error);
    res.status(500).json({ message: 'Failed to register' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      return res.status(400).json({ message: 'User not found or not verified' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    // Convert to object and remove sensitive fields
    const { password: _, otp: __, otpExpires: ___, ...userData } = user.toObject();
    res.status(200).json({ message: 'Login successful', user: userData, token });
  } catch (error) {
    console.error('[AUTH] Login Error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

// Send Forgot Password OTP
exports.sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send email asynchronously (don't wait for it)
    transporter.sendMail({
      from: `"Codec Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Codec Password Reset Code',
      text: `Your Codec Password Reset Code is: ${otp}\n\nThis code expires in 10 minutes.`
    }).catch(err => console.error('[EMAIL] Forgot password OTP send error:', err));

    // Respond immediately
    res.status(200).json({ message: 'Reset OTP sent successfully' });
  } catch (error) {
    console.error('[AUTH] Forgot Pw OTP Error:', error);
    res.status(500).json({ message: 'Failed to send reset code' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = newPassword; // Hashing handled by userSchema.pre('save')
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('[AUTH] Reset Pw Error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// Get Current User (for token verification)
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('[AUTH] Get Current User Error:', error);
    res.status(500).json({ message: 'Failed to get user data' });
  }
};

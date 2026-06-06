import { validationResult } from 'express-validator';
import crypto from 'crypto';
import User from '../models/User.js';
import Borrow from '../models/Borrow.js';
import Reservation from '../models/Reservation.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../middleware/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../services/emailService.js';

const ensureValidRequest = (req) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 400;
    throw error;
  }
};

const registerUser = asyncHandler(async (req, res) => {
  ensureValidRequest(req);

  const { name, email, password, role } = req.body;
  const normalizedRole = ['user', 'librarian', 'admin'].includes(String(role || '').trim().toLowerCase())
    ? String(role).trim().toLowerCase()
    : 'user';
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    res.status(409);
    throw new Error('Email already exists');
  }

  const user = await User.create({ name, email, password, role: normalizedRole });

  res.status(201).json({
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

const loginUser = asyncHandler(async (req, res) => {
  ensureValidRequest(req);

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const [borrowingHistory, reservations, notifications] = await Promise.all([
    Borrow.find({ user: req.user._id }).populate('book', 'title author isbn').sort({ createdAt: -1 }),
    Reservation.find({ user: req.user._id }).populate('book', 'title author isbn').sort({ createdAt: -1 }),
    Notification.find({ $or: [{ user: req.user._id }, { user: null }] }).sort({ createdAt: -1 }).limit(20)
  ]);

  res.json({
    user: req.user,
    borrowingHistory,
    reservations,
    notifications
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  const user = await User.findById(req.user._id);

  user.name = name || user.name;
  user.phone = phone ?? user.phone;
  user.address = address ?? user.address;

  await user.save();

  res.json(user);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return success-like response to avoid account enumeration.
  if (!user) {
    return res.json({ message: 'If an account exists, a reset link has been sent.' });
  }

  const rawToken = crypto.randomBytes(20).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 15);
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Password reset request',
    text: `Reset your password using this link: ${resetUrl}`
  });

  return res.json({ message: 'If an account exists, a reset link has been sent.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token || '').digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Reset token is invalid or expired');
  }

  user.password = newPassword;
  user.resetPasswordToken = '';
  user.resetPasswordExpires = null;
  await user.save();

  res.json({ message: 'Password reset successful' });
});

export { registerUser, loginUser, getCurrentUser, updateProfile, changePassword, forgotPassword, resetPassword };

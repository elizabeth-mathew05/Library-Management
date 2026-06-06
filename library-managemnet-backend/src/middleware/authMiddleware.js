import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from './asyncHandler.js';

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Authentication token missing');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  const normalizedAllowedRoles = roles.map((role) => String(role).trim().toLowerCase());
  const userRole = String(req.user?.role || '').trim().toLowerCase();

  if (!req.user || !normalizedAllowedRoles.includes(userRole)) {
    res.status(403);
    throw new Error('Access denied');
  }

  next();
};

export { protect, authorize };

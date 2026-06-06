import express from 'express';
import { body } from 'express-validator';
import { registerUser, loginUser, getCurrentUser, updateProfile, changePassword, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  registerUser
);
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  loginUser
);
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/forgot-password', [body('email').isEmail().withMessage('Valid email is required')], forgotPassword);
router.post('/reset-password', [body('token').notEmpty().withMessage('Reset token is required'), body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')], resetPassword);

export default router;

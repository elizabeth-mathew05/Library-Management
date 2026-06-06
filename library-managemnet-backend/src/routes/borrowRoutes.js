import express from 'express';
import { getBorrows, borrowBook, returnBook, sendOverdueReminders } from '../controllers/borrowController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getBorrows);
router.post('/', protect, borrowBook);
router.post('/overdue-reminders', protect, authorize('librarian', 'admin'), sendOverdueReminders);
router.patch('/:id/return', protect, returnBook);

export default router;

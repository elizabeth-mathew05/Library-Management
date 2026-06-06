import express from 'express';
import { getAllReviews, getReviewsForBook, createReview, deleteReview, moderateReview } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('librarian', 'admin'), getAllReviews);
router.get('/book/:bookId', getReviewsForBook);
router.post('/book/:bookId', protect, createReview);
router.patch('/:id/moderate', protect, authorize('librarian', 'admin'), moderateReview);
router.delete('/:id', protect, authorize('librarian', 'admin'), deleteReview);

export default router;

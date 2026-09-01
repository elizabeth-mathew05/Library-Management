import express from 'express';
import { body } from 'express-validator';
import { getBooks, getBookById, createBook, updateBook, deleteBook } from '../controllers/bookController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const currentYear = new Date().getFullYear();

const bookValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be 200 characters or fewer'),
  body('author').trim().notEmpty().withMessage('Author is required').isLength({ max: 120 }).withMessage('Author must be 120 characters or fewer'),
  body('isbn').trim().notEmpty().withMessage('ISBN is required').matches(/^[0-9-]{10,17}$/).withMessage('ISBN must be 10-17 digits or hyphens'),
  body('genre').trim().notEmpty().withMessage('Genre is required'),
  body('publicationYear')
    .isInt({ min: 1000, max: currentYear })
    .withMessage(`Publication year must be between 1000 and ${currentYear}`),
  body('totalCopies').isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
  body('availableCopies')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Available copies cannot be negative')
    .custom((value, { req }) => {
      if (value !== undefined && Number(value) > Number(req.body.totalCopies)) {
        throw new Error('Available copies cannot exceed total copies');
      }
      return true;
    })
];

router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', protect, authorize('librarian', 'admin'), bookValidation, createBook);
router.put('/:id', protect, authorize('librarian', 'admin'), bookValidation, updateBook);
router.delete('/:id', protect, authorize('librarian', 'admin'), deleteBook);

export default router;

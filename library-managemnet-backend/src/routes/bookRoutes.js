import express from 'express';
import { body } from 'express-validator';
import { getBooks, getBookById, createBook, updateBook, deleteBook } from '../controllers/bookController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const bookValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('author').notEmpty().withMessage('Author is required'),
  body('isbn').notEmpty().withMessage('ISBN is required'),
  body('genre').notEmpty().withMessage('Genre is required'),
  body('publicationYear').isInt({ min: 1000 }).withMessage('Valid publication year is required'),
  body('totalCopies').isInt({ min: 1 }).withMessage('Total copies must be at least 1')
];

router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', protect, authorize('librarian', 'admin'), bookValidation, createBook);
router.put('/:id', protect, authorize('librarian', 'admin'), bookValidation, updateBook);
router.delete('/:id', protect, authorize('librarian', 'admin'), deleteBook);

export default router;

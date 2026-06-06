import { validationResult } from 'express-validator';
import Book from '../models/Book.js';
import Review from '../models/Review.js';
import asyncHandler from '../middleware/asyncHandler.js';
import getBookStatus from '../utils/bookStatus.js';

const ensureValidRequest = (req) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 400;
    throw error;
  }
};

const syncAverageRating = async (bookId) => {
  const reviews = await Review.find({ book: bookId });
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  await Book.findByIdAndUpdate(bookId, { averageRating });
};

const getBooks = asyncHandler(async (req, res) => {
  const { search = '', genre, status } = req.query;
  const filters = {};

  if (search) {
    filters.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { genre: { $regex: search, $options: 'i' } },
      { isbn: { $regex: search, $options: 'i' } }
    ];
  }

  if (genre) {
    filters.genre = genre;
  }

  if (status) {
    filters.status = status;
  }

  const books = await Book.find(filters).sort({ createdAt: -1 });
  res.json(books);
});

const getBookById = asyncHandler(async (req, res) => {
  const [book, reviews] = await Promise.all([
    Book.findById(req.params.id),
    Review.find({ book: req.params.id }).populate('user', 'name role').sort({ createdAt: -1 })
  ]);

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  res.json({ book, reviews });
});

const createBook = asyncHandler(async (req, res) => {
  ensureValidRequest(req);
  const payload = req.body;
  const availableCopies = payload.availableCopies ?? payload.totalCopies;

  const book = await Book.create({
    ...payload,
    availableCopies,
    status: getBookStatus(availableCopies, payload.totalCopies)
  });

  res.status(201).json(book);
});

const updateBook = asyncHandler(async (req, res) => {
  ensureValidRequest(req);

  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  Object.assign(book, req.body);
  book.status = getBookStatus(book.availableCopies, book.totalCopies);

  await book.save();
  await syncAverageRating(book._id);

  res.json(book);
});

const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  await book.deleteOne();
  res.json({ message: 'Book deleted successfully' });
});

export { getBooks, getBookById, createBook, updateBook, deleteBook, syncAverageRating };

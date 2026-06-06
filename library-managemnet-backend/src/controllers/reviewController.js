import Review from '../models/Review.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { syncAverageRating } from './bookController.js';

const getAllReviews = asyncHandler(async (req, res) => {
  const { search = '', rating, moderated, bookId } = req.query;
  const filters = {};

  if (bookId) {
    filters.book = bookId;
  }

  if (rating) {
    filters.rating = Number(rating);
  }

  if (moderated === 'true' || moderated === 'false') {
    filters.moderated = moderated === 'true';
  }

  const reviews = await Review.find(filters)
    .populate('user', 'name email role')
    .populate('book', 'title author isbn genre')
    .sort({ createdAt: -1 });

  if (!search) {
    return res.json(reviews);
  }

  const term = String(search).toLowerCase();
  const filtered = reviews.filter((review) => {
    const bookTitle = String(review.book?.title || '').toLowerCase();
    const bookAuthor = String(review.book?.author || '').toLowerCase();
    const userName = String(review.user?.name || '').toLowerCase();
    const comment = String(review.comment || '').toLowerCase();

    return (
      bookTitle.includes(term) ||
      bookAuthor.includes(term) ||
      userName.includes(term) ||
      comment.includes(term)
    );
  });

  return res.json(filtered);
});

const getReviewsForBook = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ book: req.params.bookId })
    .populate('user', 'name role')
    .sort({ createdAt: -1 });

  res.json(reviews);
});

const createReview = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const { rating, comment } = req.body;

  const existingReview = await Review.findOne({ user: req.user._id, book: bookId });

  if (existingReview) {
    existingReview.rating = rating;
    existingReview.comment = comment;
    await existingReview.save();
    await syncAverageRating(bookId);
    return res.json(await existingReview.populate('user', 'name role'));
  }

  const review = await Review.create({
    user: req.user._id,
    book: bookId,
    rating,
    comment
  });

  await syncAverageRating(bookId);
  return res.status(201).json(await review.populate('user', 'name role'));
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  await review.deleteOne();
  await syncAverageRating(review.book);

  res.json({ message: 'Review removed successfully' });
});

const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  review.moderated = Boolean(req.body.moderated);
  await review.save();

  res.json(review);
});

export { getAllReviews, getReviewsForBook, createReview, deleteReview, moderateReview };

import Reservation from '../models/Reservation.js';
import Book from '../models/Book.js';
import asyncHandler from '../middleware/asyncHandler.js';

const getReservations = asyncHandler(async (req, res) => {
  const filters = req.user.role === 'user' ? { user: req.user._id } : {};
  const reservations = await Reservation.find(filters)
    .populate('user', 'name email role')
    .populate('book', 'title author isbn status')
    .sort({ createdAt: -1 });

  res.json(reservations);
});

const createReservation = asyncHandler(async (req, res) => {
  const { bookId } = req.body;
  const book = await Book.findById(bookId);

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  const existingReservation = await Reservation.findOne({
    user: req.user._id,
    book: bookId,
    status: { $in: ['queued', 'ready'] }
  });

  if (existingReservation) {
    res.status(400);
    throw new Error('You already reserved this book');
  }

  const queuePosition = (await Reservation.countDocuments({ book: bookId, status: 'queued' })) + 1;
  const reservation = await Reservation.create({
    user: req.user._id,
    book: bookId,
    queuePosition,
    status: book.availableCopies > 0 ? 'ready' : 'queued'
  });

  res.status(201).json(await reservation.populate('book', 'title author isbn status'));
});

const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  if (req.user.role === 'user' && reservation.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  reservation.status = 'cancelled';
  await reservation.save();

  res.json({ message: 'Reservation cancelled successfully' });
});

export { getReservations, createReservation, cancelReservation };

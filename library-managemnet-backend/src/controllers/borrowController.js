import Borrow from '../models/Borrow.js';
import Book from '../models/Book.js';
import Reservation from '../models/Reservation.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';
import getBookStatus from '../utils/bookStatus.js';
import sendEmail from '../services/emailService.js';

const lateFeePerDay = Number(process.env.LATE_FEE_PER_DAY || 2);
const defaultBorrowDays = Number(process.env.DEFAULT_BORROW_DAYS || 14);
const maxBorrowLimit = Number(process.env.MAX_BORROW_LIMIT || 3);

const calculateLateFee = (dueDate, returnDate) => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);
  const diffMs = returned.getTime() - due.getTime();
  const lateDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return lateDays * lateFeePerDay;
};

const getBorrows = asyncHandler(async (req, res) => {
  const filters = req.user.role === 'user' ? { user: req.user._id } : {};
  const borrows = await Borrow.find(filters)
    .populate('user', 'name email role')
    .populate('book', 'title author isbn')
    .sort({ createdAt: -1 });

  res.json(borrows);
});

const borrowBook = asyncHandler(async (req, res) => {
  const { bookId, userId } = req.body;
  const borrowerId = req.user.role === 'user' ? req.user._id : userId;

  const [book, user, activeBorrowCount] = await Promise.all([
    Book.findById(bookId),
    User.findById(borrowerId),
    Borrow.countDocuments({ user: borrowerId, status: { $in: ['borrowed', 'overdue'] } })
  ]);

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  if (!user) {
    res.status(404);
    throw new Error('Borrower not found');
  }

  if (book.availableCopies <= 0) {
    res.status(400);
    throw new Error('Book is currently unavailable');
  }

  if (activeBorrowCount >= maxBorrowLimit) {
    res.status(400);
    throw new Error(`Borrowing limit reached (${maxBorrowLimit})`);
  }

  const borrowedAt = new Date();
  const dueDate = new Date(borrowedAt);
  dueDate.setDate(dueDate.getDate() + defaultBorrowDays);

  const borrow = await Borrow.create({
    user: borrowerId,
    book: book._id,
    borrowedAt,
    dueDate
  });

  book.availableCopies -= 1;
  book.status = getBookStatus(book.availableCopies, book.totalCopies);
  await book.save();

  res.status(201).json(await borrow.populate('book', 'title author isbn'));
});

const returnBook = asyncHandler(async (req, res) => {
  const borrow = await Borrow.findById(req.params.id).populate('book').populate('user', 'name email');

  if (!borrow) {
    res.status(404);
    throw new Error('Borrow record not found');
  }

  const isOwner = borrow.user._id.toString() === req.user._id.toString();
  const isStaff = ['admin', 'librarian'].includes(String(req.user.role || '').toLowerCase());

  if (!isOwner && !isStaff) {
    res.status(403);
    throw new Error('You can only return your own borrowed books');
  }

  if (borrow.returnedAt) {
    res.status(400);
    throw new Error('Book already returned');
  }

  const returnedAt = new Date();
  const lateFee = calculateLateFee(borrow.dueDate, returnedAt);

  borrow.returnedAt = returnedAt;
  borrow.lateFee = lateFee;
  borrow.status = 'returned';
  await borrow.save();

  const book = await Book.findById(borrow.book._id);
  book.availableCopies += 1;
  book.status = getBookStatus(book.availableCopies, book.totalCopies);
  await book.save();

  const nextReservation = await Reservation.findOne({ book: book._id, status: 'queued' })
    .sort({ createdAt: 1 })
    .populate('user', 'email name');

  if (nextReservation) {
    nextReservation.status = 'ready';
    nextReservation.notifiedAt = new Date();
    await nextReservation.save();

    await Notification.create({
      user: nextReservation.user._id,
      type: 'reservation',
      title: 'Reserved book available',
      message: `${book.title} is now available for pickup.`
    });

    await sendEmail({
      to: nextReservation.user.email,
      subject: 'Reserved book available',
      text: `${book.title} is now available for pickup.`
    });
  }

  res.json(borrow);
});

const sendOverdueReminders = asyncHandler(async (req, res) => {
  const borrows = await Borrow.find({
    returnedAt: null,
    dueDate: { $lt: new Date() }
  })
    .populate('user', 'email name')
    .populate('book', 'title');

  const reminders = await Promise.all(
    borrows.map(async (borrow) => {
      borrow.status = 'overdue';
      await borrow.save();

      await Notification.create({
        user: borrow.user._id,
        type: 'overdue',
        title: 'Overdue book reminder',
        message: `${borrow.book.title} is overdue. Please return it as soon as possible.`
      });

      await sendEmail({
        to: borrow.user.email,
        subject: 'Library overdue reminder',
        text: `${borrow.book.title} is overdue. Please return it as soon as possible.`
      });

      return borrow._id;
    })
  );

  res.json({ message: 'Overdue reminders processed', remindersSent: reminders.length });
});

export { getBorrows, borrowBook, returnBook, sendOverdueReminders };

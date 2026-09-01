import Book from '../models/Book.js';
import Borrow from '../models/Borrow.js';
import User from '../models/User.js';
import Reservation from '../models/Reservation.js';
import Payment from '../models/Payment.js';
import asyncHandler from '../middleware/asyncHandler.js';

const getDashboardReport = asyncHandler(async (req, res) => {
  const [
    totalBooks,
    totalUsers,
    activeBorrows,
    overdueBooks,
    reservations,
    payments,
    popularBooks,
    inventoryByGenre,
    inventoryByStatus,
    overdueList,
    userActivity,
    recentBorrows
  ] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments(),
    Borrow.countDocuments({ returnedAt: null }),
    Borrow.countDocuments({ returnedAt: null, dueDate: { $lt: new Date() } }),
    Reservation.countDocuments({ status: { $in: ['queued', 'ready'] } }),
    Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, revenue: { $sum: '$amount' } } }]),
    Borrow.aggregate([
      { $group: { _id: '$book', borrowCount: { $sum: 1 } } },
      { $sort: { borrowCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      { $project: { title: '$book.title', author: '$book.author', borrowCount: 1 } }
    ]),
    Book.aggregate([
      { $group: { _id: '$genre', count: { $sum: 1 }, available: { $sum: '$availableCopies' } } },
      { $sort: { count: -1 } }
    ]),
    Book.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Borrow.find({ returnedAt: null, dueDate: { $lt: new Date() } })
      .populate('user', 'name email')
      .populate('book', 'title author isbn')
      .sort({ dueDate: 1 })
      .limit(15),
    Borrow.aggregate([
      { $group: { _id: '$user', borrowCount: { $sum: 1 }, overdueCount: { $sum: { $cond: [{ $and: [{ $eq: ['$returnedAt', null] }, { $lt: ['$dueDate', new Date()] }] }, 1, 0] } } } },
      { $sort: { borrowCount: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $project: { name: '$user.name', email: '$user.email', role: '$user.role', borrowCount: 1, overdueCount: 1 } }
    ]),
    Borrow.find()
      .populate('user', 'name email')
      .populate('book', 'title')
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  res.json({
    totalBooks,
    totalUsers,
    activeBorrows,
    overdueBooks,
    activeReservations: reservations,
    revenue: payments[0]?.revenue || 0,
    popularBooks,
    inventoryByGenre,
    inventoryByStatus,
    overdueList,
    userActivity,
    recentBorrows
  });
});

export { getDashboardReport };

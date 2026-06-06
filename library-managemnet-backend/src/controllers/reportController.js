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
    popularBooks
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
      { $project: { title: '$book.title', borrowCount: 1 } }
    ])
  ]);

  res.json({
    totalBooks,
    totalUsers,
    activeBorrows,
    overdueBooks,
    activeReservations: reservations,
    revenue: payments[0]?.revenue || 0,
    popularBooks
  });
});

export { getDashboardReport };

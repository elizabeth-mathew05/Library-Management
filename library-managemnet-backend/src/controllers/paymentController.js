import Payment from '../models/Payment.js';
import Borrow from '../models/Borrow.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { createPaymentIntent } from '../services/paymentService.js';

const createLateFeePayment = asyncHandler(async (req, res) => {
  const { borrowId } = req.body;
  const borrow = await Borrow.findById(borrowId);

  if (!borrow) {
    res.status(404);
    throw new Error('Borrow record not found');
  }

  if (borrow.lateFee <= 0) {
    res.status(400);
    throw new Error('No late fee due for this borrow record');
  }

  const paymentIntent = await createPaymentIntent({
    amount: borrow.lateFee,
    metadata: {
      borrowId: borrow._id.toString(),
      userId: req.user._id.toString()
    }
  });

  const payment = await Payment.create({
    user: req.user._id,
    borrow: borrow._id,
    amount: borrow.lateFee,
    status: 'pending',
    stripePaymentIntentId: paymentIntent.id
  });

  res.status(201).json({
    payment,
    clientSecret: paymentIntent.client_secret
  });
});

const getPayments = asyncHandler(async (req, res) => {
  const filters = req.user.role === 'user' ? { user: req.user._id } : {};
  const payments = await Payment.find(filters).populate('borrow').sort({ createdAt: -1 });
  res.json(payments);
});

export { createLateFeePayment, getPayments };

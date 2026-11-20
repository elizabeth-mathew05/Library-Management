import Payment from '../models/Payment.js';
import Borrow from '../models/Borrow.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { createPaymentIntent } from '../services/paymentService.js';

const TEST_SUCCESS_CARD = '4242424242424242';
const TEST_DECLINE_CARD = '4000000000000002';

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

const isValidExpiry = (expiry = '') => {
  const match = String(expiry).trim().match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!match) {
    return false;
  }

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) {
    return false;
  }

  const now = new Date();
  const expiryDate = new Date(year, month, 0, 23, 59, 59);
  return expiryDate >= now;
};

const validateCardDetails = ({ cardNumber, expiry, cvc, cardholderName }) => {
  const number = digitsOnly(cardNumber);
  const securityCode = digitsOnly(cvc);
  const name = String(cardholderName || '').trim();

  if (name.length < 2) {
    throw Object.assign(new Error('Cardholder name is required.'), { statusCode: 400 });
  }

  if (number.length < 13 || number.length > 19) {
    throw Object.assign(new Error('Enter a valid card number.'), { statusCode: 400 });
  }

  if (!isValidExpiry(expiry)) {
    throw Object.assign(new Error('Enter a valid expiry date in MM/YY format.'), { statusCode: 400 });
  }

  if (securityCode.length < 3 || securityCode.length > 4) {
    throw Object.assign(new Error('Enter a valid CVC.'), { statusCode: 400 });
  }

  return { number, last4: number.slice(-4) };
};

const createLateFeePayment = asyncHandler(async (req, res) => {
  const { borrowId } = req.body;
  const borrow = await Borrow.findById(borrowId).populate('book', 'title author');

  if (!borrow) {
    res.status(404);
    throw new Error('Borrow record not found');
  }

  const isOwner = borrow.user.toString() === req.user._id.toString();
  const isStaff = ['admin', 'librarian'].includes(req.user.role);
  if (!isOwner && !isStaff) {
    res.status(403);
    throw new Error('You can only pay your own late fees');
  }

  if (borrow.lateFee <= 0) {
    res.status(400);
    throw new Error('No late fee due for this borrow record');
  }

  if (borrow.lateFeePaid) {
    res.status(400);
    throw new Error('This late fee has already been paid');
  }

  const existingPaid = await Payment.findOne({ borrow: borrow._id, status: 'paid' });
  if (existingPaid) {
    borrow.lateFeePaid = true;
    await borrow.save();
    res.status(400);
    throw new Error('This late fee has already been paid');
  }

  const existingPending = await Payment.findOne({ borrow: borrow._id, status: 'pending' });
  if (existingPending) {
    return res.json({
      payment: existingPending,
      amount: borrow.lateFee,
      bookTitle: borrow.book?.title || 'Library late fee'
    });
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
    amount: borrow.lateFee,
    bookTitle: borrow.book?.title || 'Library late fee',
    clientSecret: paymentIntent.client_secret
  });
});

const confirmLateFeePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate({
    path: 'borrow',
    populate: { path: 'book', select: 'title author' }
  });

  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  const isOwner = payment.user.toString() === req.user._id.toString();
  const isStaff = ['admin', 'librarian'].includes(req.user.role);
  if (!isOwner && !isStaff) {
    res.status(403);
    throw new Error('Access denied');
  }

  if (payment.status === 'paid') {
    res.status(400);
    throw new Error('This payment is already complete');
  }

  const { number, last4 } = validateCardDetails(req.body);

  if (number === TEST_DECLINE_CARD) {
    payment.status = 'failed';
    await payment.save();
    res.status(402);
    throw new Error('The card was declined. Use 4242 4242 4242 4242 for a successful test payment.');
  }

  if (number !== TEST_SUCCESS_CARD && !number.startsWith('4') && !number.startsWith('5')) {
    res.status(400);
    throw new Error('Use a Visa or Mastercard number. Test card: 4242 4242 4242 4242.');
  }

  payment.status = 'paid';
  payment.stripePaymentIntentId = payment.stripePaymentIntentId || `gw_${last4}_${Date.now()}`;
  await payment.save();

  if (payment.borrow) {
    payment.borrow.lateFeePaid = true;
    await payment.borrow.save();
  }

  await Notification.create({
    user: payment.user,
    type: 'payment',
    title: 'Late fee paid',
    message: `Payment of $${Number(payment.amount).toFixed(2)} for ${payment.borrow?.book?.title || 'a library late fee'} was received.`
  });

  res.json({
    payment,
    message: 'Payment completed successfully'
  });
});

const getPayments = asyncHandler(async (req, res) => {
  const filters = req.user.role === 'user' ? { user: req.user._id } : {};
  const payments = await Payment.find(filters)
    .populate({ path: 'borrow', populate: { path: 'book', select: 'title author' } })
    .sort({ createdAt: -1 });
  res.json(payments);
});

export { createLateFeePayment, confirmLateFeePayment, getPayments };

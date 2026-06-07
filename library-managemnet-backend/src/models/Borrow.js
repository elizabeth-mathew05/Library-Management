import mongoose from 'mongoose';

const borrowSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    borrowedAt: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: true
    },
    returnedAt: {
      type: Date,
      default: null
    },
    lateFee: {
      type: Number,
      default: 0
    },
    overdueReminderSentAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['borrowed', 'returned', 'overdue'],
      default: 'borrowed'
    }
  },
  {
    timestamps: true
  }
);

const Borrow = mongoose.model('Borrow', borrowSchema);

export default Borrow;

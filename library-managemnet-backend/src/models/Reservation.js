import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['queued', 'ready', 'cancelled', 'fulfilled'],
      default: 'queued'
    },
    queuePosition: {
      type: Number,
      default: 1
    },
    notifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;

import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      required: true,
      trim: true
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    genre: {
      type: String,
      required: true,
      trim: true
    },
    publicationYear: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    coverImage: {
      type: String,
      default: ''
    },
    totalCopies: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    availableCopies: {
      type: Number,
      required: true,
      min: 0,
      default: 1
    },
    status: {
      type: String,
      enum: ['available', 'limited', 'unavailable'],
      default: 'available'
    },
    averageRating: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Book = mongoose.model('Book', bookSchema);

export default Book;

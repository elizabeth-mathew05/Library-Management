import { Link } from 'react-router-dom';
import { canBorrowBook, canReserveBook } from '../utils/bookAvailability.js';

export default function BookCard({ book, isStaff = false, canReview = false, onBorrow, onReserve, onEdit, onDelete, canDelete = true }) {
  const canBorrow = canBorrowBook(book);
  const canReserve = canReserveBook(book);
  const showMemberActions = !isStaff;

  return (
    <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl text-slate-950 sm:text-2xl">{book.title}</h3>
          <p className="text-sm text-slate-700">{book.author}</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase text-white">
          {book.status}
        </span>
      </div>

      <div className="space-y-2 text-sm text-slate-800">
        <p>Genre: {book.genre}</p>
        <p>ISBN: {book.isbn}</p>
        <p>Publication year: {book.publicationYear}</p>
        <p>Available copies: {book.availableCopies}</p>
        <p>Total copies: {book.totalCopies}</p>
        <p>Rating: {book.averageRating?.toFixed?.(1) || '0.0'}</p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
        <Link to={`/books/${book._id}?mode=view`} className="inline-flex min-h-10 items-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white">
          View Reviews
        </Link>

        {canReview && (
          <Link to={`/books/${book._id}?mode=add`} className="inline-flex min-h-10 items-center rounded-full border border-teal-700 bg-teal-50 px-4 text-sm font-semibold text-teal-900">
            Add Review
          </Link>
        )}

        {showMemberActions && canBorrow && (
          <button
            onClick={() => onBorrow?.(book)}
            className="inline-flex min-h-10 items-center rounded-full bg-teal-700 px-4 text-sm font-semibold text-white"
          >
            Borrow
          </button>
        )}

        {showMemberActions && canReserve && (
          <button
            onClick={() => onReserve?.(book)}
            className="inline-flex min-h-10 items-center rounded-full border border-slate-400 px-4 text-sm font-semibold text-slate-900"
          >
            Reserve
          </button>
        )}

        {isStaff && (
          <>
            <button onClick={() => onEdit?.(book)} className="inline-flex min-h-10 items-center rounded-full bg-slate-800 px-4 text-sm font-semibold text-white">
              Edit
            </button>
            {canDelete && (
              <button onClick={() => onDelete?.(book)} className="inline-flex min-h-10 items-center rounded-full bg-rose-700 px-4 text-sm font-semibold text-white">
                Delete
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );
}

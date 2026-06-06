import { Link } from 'react-router-dom';

export default function BookCard({
  book,
  isStaff = false,
  canReview = false,
  onBorrow,
  onReserve,
  onEdit,
  onDelete
}) {
  const canBorrow = Number(book.availableCopies) > 0;

  return (
    <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-slate-950">{book.title}</h3>
          <p className="text-sm text-slate-500">{book.author}</p>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
          {book.status}
        </span>
      </div>
      <div className="space-y-2 text-sm text-slate-600">
        <p>Genre: {book.genre}</p>
        <p>ISBN: {book.isbn}</p>
        <p>Publication year: {book.publicationYear}</p>
        <p>Available copies: {book.availableCopies}</p>
        <p>Total copies: {book.totalCopies}</p>
        <p>Rating: {book.averageRating?.toFixed?.(1) || '0.0'}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={`/books/${book._id}?mode=view`} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">
          View Reviews
        </Link>
        {canReview && (
          <Link to={`/books/${book._id}?mode=add`} className="rounded-full border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800">
            Add Review
          </Link>
        )}
        <button
          onClick={() => onBorrow?.(book)}
          disabled={!canBorrow}
          className={`rounded-full px-4 py-2 text-sm font-medium text-white ${
            canBorrow ? 'bg-teal-600' : 'cursor-not-allowed bg-slate-400'
          }`}
        >
          Borrow
        </button>
        <button
          onClick={() => onReserve?.(book)}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Reserve
        </button>

        {isStaff && (
          <>
            <button
              onClick={() => onEdit?.(book)}
              className="rounded-full bg-amber-400 px-4 py-2 text-sm font-medium text-slate-950"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(book)}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}

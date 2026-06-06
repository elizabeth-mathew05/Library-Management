import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../api/client.js';

export default function BookDetailsPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');

  const showReviewForm = searchParams.get('mode') !== 'view';

  const loadBook = async () => {
    const { data } = await api.get(`/books/${id}`);
    setBook(data.book);
    setReviews(data.reviews || []);
  };

  useEffect(() => {
    loadBook();
  }, [id]);

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      await api.post(`/reviews/book/${id}`, {
        rating: Number(form.rating),
        comment: form.comment
      });
      setForm({ rating: 5, comment: '' });
      setMessage('Review submitted successfully');
      loadBook();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to submit review');
    }
  };

  if (!book) {
    return <div className="text-slate-600">Loading book...</div>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr,1fr]">
      <section className="rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-xl shadow-slate-200/60">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-700">{book.genre}</p>
        <h1 className="mt-3 font-display text-5xl text-slate-950">{book.title}</h1>
        <p className="mt-2 text-lg text-slate-600">by {book.author}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-100 p-4">ISBN: {book.isbn}</div>
          <div className="rounded-2xl bg-slate-100 p-4">Year: {book.publicationYear}</div>
          <div className="rounded-2xl bg-slate-100 p-4">Available copies: {book.availableCopies}</div>
          <div className="rounded-2xl bg-slate-100 p-4">Average rating: {book.averageRating?.toFixed?.(1) || '0.0'}</div>
        </div>

        <p className="mt-6 text-slate-700">{book.description || 'No description added yet.'}</p>
      </section>

      <section className="space-y-6">
        {showReviewForm && (
          <article className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
            <h2 className="font-display text-3xl text-slate-950">Write a review</h2>
            <p className="mt-2 text-sm text-slate-600">All logged-in users can submit a review for this book.</p>
            <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Review</span>
                <textarea
                  rows="5"
                  placeholder="Write your feedback"
                  value={form.comment}
                  onChange={(event) => setForm({ ...form, comment: event.target.value })}
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500"
                  required
                />
              </label>
              <label className="block max-w-[220px] space-y-2 text-sm font-medium text-slate-700">
                <span>Rating</span>
                <select
                  value={form.rating}
                  onChange={(event) => setForm({ ...form, rating: event.target.value })}
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="inline-flex min-w-[180px] items-center justify-center rounded-2xl bg-teal-600 px-5 py-3 font-semibold text-white">
                Submit Review
              </button>
            </form>
            {message && <p className="mt-4 text-sm text-teal-700">{message}</p>}
          </article>
        )}

        <article className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
          <h2 className="font-display text-3xl text-slate-950">User Reviews (All Users)</h2>
          <div className="mt-4 space-y-4">
            {reviews.length ? (
              reviews.map((review) => (
                <div key={review._id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">{review.user?.name || 'Unknown user'}</h3>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">{review.rating}/5</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                  {review.moderated && (
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-amber-700">Moderated by admin</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-500">No reviews yet for this book.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

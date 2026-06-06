import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ search: '', rating: '', moderated: '' });

  const loadReviews = async (nextFilters = filters) => {
    const params = {
      search: nextFilters.search,
      rating: nextFilters.rating,
      moderated: nextFilters.moderated
    };

    const { data } = await api.get('/reviews', { params });
    setReviews(data);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    try {
      await loadReviews(filters);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load reviews');
    }
  };

  const handleModeration = async (reviewId, moderated) => {
    try {
      await api.patch(`/reviews/${reviewId}/moderate`, { moderated });
      setMessage(moderated ? 'Review marked as moderated' : 'Review unmoderated');
      loadReviews();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update moderation status');
    }
  };

  const handleDelete = async (reviewId) => {
    const confirmed = window.confirm('Delete this review?');

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/reviews/${reviewId}`);
      setMessage('Review deleted successfully');
      loadReviews();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete review');
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h1 className="font-display text-4xl text-slate-950">Review Management</h1>
        <p className="mt-2 text-slate-600">Search, moderate, and remove user reviews across the full catalog.</p>

        <form onSubmit={handleSearch} className="mt-6 grid gap-4 lg:grid-cols-[2fr,1fr,1fr,auto]">
          <input
            placeholder="Search by book, user, or comment"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
          <select value={filters.rating} onChange={(event) => setFilters({ ...filters, rating: event.target.value })}>
            <option value="">All ratings</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>
            ))}
          </select>
          <select value={filters.moderated} onChange={(event) => setFilters({ ...filters, moderated: event.target.value })}>
            <option value="">All moderation</option>
            <option value="true">Moderated</option>
            <option value="false">Unmoderated</option>
          </select>
          <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white">
            Search
          </button>
        </form>
      </section>

      {message && (
        <section className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </section>
      )}

      <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3">Book</th>
                <th className="pb-3">User</th>
                <th className="pb-3">Rating</th>
                <th className="pb-3">Comment</th>
                <th className="pb-3">Moderated</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id} className="border-t border-slate-200 align-top">
                  <td className="py-4">
                    <p className="font-semibold text-slate-900">{review.book?.title}</p>
                    <p className="text-xs text-slate-500">{review.book?.author}</p>
                  </td>
                  <td className="py-4">
                    <p className="font-semibold text-slate-900">{review.user?.name}</p>
                    <p className="text-xs text-slate-500">{review.user?.email}</p>
                  </td>
                  <td className="py-4">{review.rating}/5</td>
                  <td className="py-4 max-w-sm text-slate-700">{review.comment}</td>
                  <td className="py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${review.moderated ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                      {review.moderated ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleModeration(review._id, !review.moderated)}
                        className="rounded-full bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-950"
                      >
                        {review.moderated ? 'Unmoderate' : 'Moderate'}
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!reviews.length && (
          <p className="mt-4 text-sm text-slate-500">No reviews match the current filters.</p>
        )}
      </section>
    </div>
  );
}

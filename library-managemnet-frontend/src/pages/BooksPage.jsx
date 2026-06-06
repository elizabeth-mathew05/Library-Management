import { useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';
import BookCard from '../components/BookCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const initialBookForm = {
  title: '',
  author: '',
  isbn: '',
  genre: '',
  publicationYear: '',
  totalCopies: 1,
  availableCopies: 1,
  description: ''
};

export default function BooksPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'librarian';

  const [books, setBooks] = useState([]);
  const [reviewableBookIds, setReviewableBookIds] = useState([]);
  const [message, setMessage] = useState('');
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [bookForm, setBookForm] = useState(initialBookForm);
  const [filters, setFilters] = useState({ search: '', genre: '', status: '' });

  const loadBooks = async (nextFilters = filters) => {
    const { data } = await api.get('/books', {
      params: {
        search: nextFilters.search,
        genre: nextFilters.genre,
        status: nextFilters.status
      }
    });

    setBooks(data);
  };

  const loadReviewableBooks = async () => {
    if (isStaff) {
      setReviewableBookIds([]);
      return;
    }

    try {
      const { data } = await api.get('/borrows');
      const returnedBookIds = data
        .filter((borrow) => borrow.status === 'returned' || borrow.returnedAt)
        .map((borrow) => borrow.book?._id)
        .filter(Boolean);

      setReviewableBookIds(Array.from(new Set(returnedBookIds)));
    } catch {
      setReviewableBookIds([]);
    }
  };

  useEffect(() => {
    loadBooks();
    loadReviewableBooks();
  }, [isStaff]);

  const resetForm = () => {
    setBookForm(initialBookForm);
    setEditingBookId(null);
    setShowBookForm(false);
  };

  const handleCreateOrUpdateBook = async (event) => {
    event.preventDefault();
    const payload = {
      ...bookForm,
      publicationYear: Number(bookForm.publicationYear),
      totalCopies: Number(bookForm.totalCopies),
      availableCopies: Number(bookForm.availableCopies)
    };

    try {
      if (editingBookId) {
        await api.put(`/books/${editingBookId}`, payload);
        setMessage('Book updated successfully');
      } else {
        await api.post('/books', payload);
        setMessage('Book added successfully');
      }

      resetForm();
      loadBooks();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save book');
    }
  };

  const handleEditBook = (book) => {
    setBookForm({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      genre: book.genre || '',
      publicationYear: book.publicationYear || '',
      totalCopies: book.totalCopies || 1,
      availableCopies: book.availableCopies || 0,
      description: book.description || ''
    });
    setEditingBookId(book._id);
    setShowBookForm(true);
    setMessage(`Editing ${book.title}`);
  };

  const handleDeleteBook = async (book) => {
    const confirmed = window.confirm(`Delete "${book.title}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/books/${book._id}`);
      setMessage('Book deleted successfully');
      loadBooks();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete book');
    }
  };

  const handleBorrow = async (book) => {
    try {
      await api.post('/borrows', { bookId: book._id, userId: user?.id });
      setMessage(`Borrowed ${book.title}`);
      loadBooks();
      loadReviewableBooks();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to borrow book');
    }
  };

  const handleReserve = async (book) => {
    try {
      await api.post('/reservations', { bookId: book._id });
      setMessage(`Reserved ${book.title}`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to reserve book');
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await loadBooks(filters);
  };

  const genres = useMemo(() => {
    return Array.from(new Set(books.map((book) => book.genre).filter(Boolean))).sort();
  }, [books]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <form onSubmit={handleSearch} className="grid gap-4 lg:grid-cols-[2fr,1fr,1fr,auto]">
          <input
            placeholder="Search by title, author, genre, or ISBN"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
          <select value={filters.genre} onChange={(event) => setFilters({ ...filters, genre: event.target.value })}>
            <option value="">All genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All status</option>
            <option value="available">Available</option>
            <option value="limited">Limited</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white">Search</button>
        </form>
      </section>

      {isStaff && (
        <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-slate-950">Inventory Management</h2>
              <p className="text-sm text-slate-600">Add, update, and remove books.</p>
            </div>
            <button
              onClick={() => {
                setEditingBookId(null);
                setBookForm(initialBookForm);
                setShowBookForm(true);
              }}
              className="rounded-2xl bg-amber-400 px-5 py-3 font-semibold text-slate-950"
            >
              Add Book
            </button>
          </div>
        </section>
      )}

      {showBookForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/60 bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl text-slate-950">{editingBookId ? 'Edit Book' : 'Add Book'}</h2>
                <p className="text-sm text-slate-600">Update the book details without taking space on the main page.</p>
              </div>
              <button type="button" onClick={resetForm} className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700">
                Close
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdateBook} className="mt-6 space-y-4">
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">Book Title</span>
                <input value={bookForm.title} onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })} required />
              </label>
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">Author Name</span>
                <input value={bookForm.author} onChange={(event) => setBookForm({ ...bookForm, author: event.target.value })} required />
              </label>
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">ISBN Number</span>
                <input value={bookForm.isbn} onChange={(event) => setBookForm({ ...bookForm, isbn: event.target.value })} required />
              </label>
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">Genre</span>
                <input value={bookForm.genre} onChange={(event) => setBookForm({ ...bookForm, genre: event.target.value })} required />
              </label>
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">Publication Year</span>
                <input type="number" value={bookForm.publicationYear} onChange={(event) => setBookForm({ ...bookForm, publicationYear: event.target.value })} required />
              </label>
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">Total Copies</span>
                <input type="number" value={bookForm.totalCopies} onChange={(event) => setBookForm({ ...bookForm, totalCopies: event.target.value })} required min="1" />
              </label>
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">Available Copies</span>
                <input type="number" value={bookForm.availableCopies} onChange={(event) => setBookForm({ ...bookForm, availableCopies: event.target.value })} min="0" required />
              </label>
              <label className="grid gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">Description</span>
                <textarea rows="4" value={bookForm.description} onChange={(event) => setBookForm({ ...bookForm, description: event.target.value })} />
              </label>
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">
                  {editingBookId ? 'Update Book' : 'Add Book'}
                </button>
                <button type="button" onClick={resetForm} className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {message && (
        <section className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700">
        Borrow and Reserve are available on each book card. Return is available from the Borrowed page. Add Review appears only for books you have returned.
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {books.map((book) => (
          <BookCard
            key={book._id}
            book={book}
            isStaff={isStaff}
            canReview={reviewableBookIds.includes(book._id)}
            onBorrow={handleBorrow}
            onReserve={handleReserve}
            onEdit={handleEditBook}
            onDelete={handleDeleteBook}
          />
        ))}
      </section>
    </div>
  );
}

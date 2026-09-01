import { useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';
import BookCard from '../components/BookCard.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canBorrowBook, canReserveBook } from '../utils/bookAvailability.js';
import { CURRENT_YEAR, MIN_PUBLICATION_YEAR, getApiErrorMessage, validateBookForm } from '../utils/validation.js';

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
  const isAdmin = user?.role === 'admin';

  const [books, setBooks] = useState([]);
  const [reviewableBookIds, setReviewableBookIds] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [bookForm, setBookForm] = useState(initialBookForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [filters, setFilters] = useState({ search: '', genre: '', status: '', year: '' });

  const showNotice = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const loadBooks = async (nextFilters = filters) => {
    const { data } = await api.get('/books', {
      params: {
        search: nextFilters.search,
        genre: nextFilters.genre,
        status: nextFilters.status,
        year: nextFilters.year
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
    setFieldErrors({});
  };

  const handleCreateOrUpdateBook = async (event) => {
    event.preventDefault();
    const nextErrors = validateBookForm(bookForm);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showNotice('Please correct the highlighted book details.', 'error');
      return;
    }

    const payload = {
      ...bookForm,
      publicationYear: Number(bookForm.publicationYear),
      totalCopies: Number(bookForm.totalCopies),
      availableCopies: Number(bookForm.availableCopies)
    };

    try {
      if (editingBookId) {
        await api.put(`/books/${editingBookId}`, payload);
        showNotice('Book updated successfully', 'success');
      } else {
        await api.post('/books', payload);
        showNotice('Book added successfully', 'success');
      }

      resetForm();
      loadBooks();
    } catch (error) {
      showNotice(getApiErrorMessage(error, 'Unable to save book'), 'error');
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
    setFieldErrors({});
    showNotice(`Editing ${book.title}`, 'info');
  };

  const handleDeleteBook = async (book) => {
    if (!isAdmin) {
      showNotice('Only admins can delete books', 'error');
      return;
    }

    const confirmed = window.confirm(`Delete "${book.title}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/books/${book._id}`);
      showNotice('Book deleted successfully', 'success');
      loadBooks();
    } catch (error) {
      showNotice(getApiErrorMessage(error, 'Unable to delete book'), 'error');
    }
  };

  const handleBorrow = async (book) => {
    if (isStaff) {
      showNotice('Borrowing is available only for normal users', 'error');
      return;
    }

    if (!canBorrowBook(book)) {
      showNotice('This title has no copies to borrow. Use Reserve instead.', 'error');
      return;
    }

    try {
      await api.post('/borrows', { bookId: book._id, userId: user?.id });
      showNotice(`Borrowed ${book.title}`, 'success');
      loadBooks();
      loadReviewableBooks();
    } catch (error) {
      showNotice(getApiErrorMessage(error, 'Unable to borrow book'), 'error');
    }
  };

  const handleReserve = async (book) => {
    if (isStaff) {
      showNotice('Reservations are available only for normal users', 'error');
      return;
    }

    if (!canReserveBook(book)) {
      showNotice('Reserve is for checked-out or high-demand titles. Borrow this copy instead.', 'error');
      return;
    }

    try {
      await api.post('/reservations', { bookId: book._id });
      showNotice(`Reserved ${book.title}`, 'success');
    } catch (error) {
      showNotice(getApiErrorMessage(error, 'Unable to reserve book'), 'error');
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
        <form onSubmit={handleSearch} className="grid items-center gap-4 lg:grid-cols-[2fr,1fr,1fr,1fr,auto]">
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
          <input
            type="number"
            min={MIN_PUBLICATION_YEAR}
            max={CURRENT_YEAR}
            placeholder="Year"
            value={filters.year}
            onChange={(event) => setFilters({ ...filters, year: event.target.value })}
          />
          <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white">Search</button>
        </form>
      </section>

      {isStaff && (
        <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-slate-950">Inventory Management</h2>
              <p className="text-sm text-slate-600">Add and update books. Delete is restricted to admins.</p>
            </div>
            <button
              onClick={() => {
                setEditingBookId(null);
                setBookForm(initialBookForm);
                setFieldErrors({});
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
                <p className="text-sm text-slate-600">Publication year must be between {MIN_PUBLICATION_YEAR} and {CURRENT_YEAR}.</p>
              </div>
              <button type="button" onClick={resetForm} className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700">
                Close
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdateBook} className="mt-6 space-y-4" noValidate>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">Book Title</span>
                <div>
                  <input value={bookForm.title} onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })} />
                  {fieldErrors.title && <p className="mt-1 text-sm text-rose-600">{fieldErrors.title}</p>}
                </div>
              </label>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">Author Name</span>
                <div>
                  <input value={bookForm.author} onChange={(event) => setBookForm({ ...bookForm, author: event.target.value })} />
                  {fieldErrors.author && <p className="mt-1 text-sm text-rose-600">{fieldErrors.author}</p>}
                </div>
              </label>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">ISBN Number</span>
                <div>
                  <input value={bookForm.isbn} onChange={(event) => setBookForm({ ...bookForm, isbn: event.target.value })} />
                  {fieldErrors.isbn && <p className="mt-1 text-sm text-rose-600">{fieldErrors.isbn}</p>}
                </div>
              </label>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">Genre</span>
                <div>
                  <input value={bookForm.genre} onChange={(event) => setBookForm({ ...bookForm, genre: event.target.value })} />
                  {fieldErrors.genre && <p className="mt-1 text-sm text-rose-600">{fieldErrors.genre}</p>}
                </div>
              </label>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">Publication Year</span>
                <div>
                  <input
                    type="number"
                    min={MIN_PUBLICATION_YEAR}
                    max={CURRENT_YEAR}
                    value={bookForm.publicationYear}
                    onChange={(event) => setBookForm({ ...bookForm, publicationYear: event.target.value })}
                  />
                  {fieldErrors.publicationYear && <p className="mt-1 text-sm text-rose-600">{fieldErrors.publicationYear}</p>}
                </div>
              </label>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">Total Copies</span>
                <div>
                  <input type="number" min="1" value={bookForm.totalCopies} onChange={(event) => setBookForm({ ...bookForm, totalCopies: event.target.value })} />
                  {fieldErrors.totalCopies && <p className="mt-1 text-sm text-rose-600">{fieldErrors.totalCopies}</p>}
                </div>
              </label>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">Available Copies</span>
                <div>
                  <input type="number" min="0" value={bookForm.availableCopies} onChange={(event) => setBookForm({ ...bookForm, availableCopies: event.target.value })} />
                  {fieldErrors.availableCopies && <p className="mt-1 text-sm text-rose-600">{fieldErrors.availableCopies}</p>}
                </div>
              </label>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
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

      <StatusMessage type={messageType}>{message}</StatusMessage>

      <section className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700">
        Search by title, author, genre, or ISBN, then filter by genre, status, or year. Borrow when copies are on the shelf. Reserve when a title is checked out or already in high demand. Reviews appear after you return a book.
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
            canDelete={isAdmin}
          />
        ))}
      </section>
    </div>
  );
}

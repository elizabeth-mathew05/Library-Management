import { useEffect, useState } from 'react';
import api from '../api/client.js';
import StatusMessage from '../components/StatusMessage.jsx';
import { CURRENT_YEAR, MIN_PUBLICATION_YEAR, getApiErrorMessage, validateBookForm } from '../utils/validation.js';

const initialBook = {
  title: '',
  author: '',
  isbn: '',
  genre: '',
  publicationYear: new Date().getFullYear(),
  totalCopies: 1,
  availableCopies: 1,
  description: ''
};

export default function AdminPage() {
  const [report, setReport] = useState(null);
  const [books, setBooks] = useState([]);
  const [bookForm, setBookForm] = useState(initialBook);
  const [editingBookId, setEditingBookId] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [announcement, setAnnouncement] = useState({ title: '', message: '' });
  const [announcementErrors, setAnnouncementErrors] = useState({});
  const [bookErrors, setBookErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isRemindersLoading, setIsRemindersLoading] = useState(false);

  const showNotice = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const loadAdminData = async () => {
    try {
      const [reportResponse, booksResponse] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/books')
      ]);

      setReport(reportResponse.data);
      setBooks(booksResponse.data);
    } catch (error) {
      showNotice(getApiErrorMessage(error, 'Unable to load admin data'), 'error');
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const resetBookForm = () => {
    setBookForm(initialBook);
    setEditingBookId(null);
    setShowBookModal(false);
    setBookErrors({});
  };

  const handleCreateOrUpdateBook = async (event) => {
    event.preventDefault();
    const nextErrors = validateBookForm(bookForm);
    setBookErrors(nextErrors);

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
        showNotice('Book updated', 'success');
      } else {
        await api.post('/books', payload);
        showNotice('Book created', 'success');
      }

      resetBookForm();
      loadAdminData();
    } catch (error) {
      showNotice(getApiErrorMessage(error, 'Unable to save book'), 'error');
    }
  };

  const handleEditBook = (book) => {
    setEditingBookId(book._id);
    setShowBookModal(true);
    setBookErrors({});
    setBookForm({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      genre: book.genre || '',
      publicationYear: book.publicationYear || new Date().getFullYear(),
      totalCopies: book.totalCopies || 1,
      availableCopies: book.availableCopies || 0,
      description: book.description || ''
    });
    showNotice(`Editing ${book.title}`, 'info');
  };

  const handleDeleteBook = async (book) => {
    const confirmed = window.confirm(`Delete "${book.title}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/books/${book._id}`);
      showNotice('Book deleted', 'success');

      if (editingBookId === book._id) {
        resetBookForm();
      }

      loadAdminData();
    } catch (error) {
      showNotice(getApiErrorMessage(error, 'Unable to delete book'), 'error');
    }
  };

  const handleSendOverdueReminders = async () => {
    setIsRemindersLoading(true);
    try {
      const response = await api.post('/borrows/overdue-reminders');
      showNotice(`${response.data.message}. ${response.data.remindersSent} reminders sent.`, 'success');
    } catch (error) {
      showNotice(getApiErrorMessage(error, 'Unable to send reminders'), 'error');
    } finally {
      setIsRemindersLoading(false);
    }
  };

  const sendAnnouncement = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    const title = announcement.title.trim();
    const announcementMessage = announcement.message.trim();

    if (!title) {
      nextErrors.title = 'Announcement title is required.';
    } else if (title.length > 120) {
      nextErrors.title = 'Title must be 120 characters or fewer.';
    }

    if (!announcementMessage) {
      nextErrors.message = 'Announcement message is required.';
    }

    setAnnouncementErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showNotice('Please complete the announcement form.', 'error');
      return;
    }

    try {
      await api.post('/notifications/announcements', { title, message: announcementMessage });
      setAnnouncement({ title: '', message: '' });
      setAnnouncementErrors({});
      showNotice('Announcement sent', 'success');
    } catch (error) {
      showNotice(getApiErrorMessage(error, 'Unable to send announcement'), 'error');
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-teal-800 px-8 py-10 text-white shadow-2xl shadow-slate-400/20">
        <h1 className="font-display text-5xl">Admin control center</h1>
        <p className="mt-3 max-w-3xl text-slate-200">Create books, review operations metrics, send announcements, and trigger overdue reminders.</p>
      </section>

      <StatusMessage type={messageType}>{message}</StatusMessage>

      {report && (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl bg-white p-6 shadow-lg"><p className="text-sm text-slate-500">Books</p><h2 className="mt-2 text-3xl font-semibold">{report.totalBooks}</h2></div>
          <div className="rounded-3xl bg-white p-6 shadow-lg"><p className="text-sm text-slate-500">Users</p><h2 className="mt-2 text-3xl font-semibold">{report.totalUsers}</h2></div>
          <div className="rounded-3xl bg-white p-6 shadow-lg"><p className="text-sm text-slate-500">Borrows</p><h2 className="mt-2 text-3xl font-semibold">{report.activeBorrows}</h2></div>
          <div className="rounded-3xl bg-white p-6 shadow-lg"><p className="text-sm text-slate-500">Overdue</p><h2 className="mt-2 text-3xl font-semibold">{report.overdueBooks}</h2></div>
          <div className="rounded-3xl bg-white p-6 shadow-lg"><p className="text-sm text-slate-500">Revenue</p><h2 className="mt-2 text-3xl font-semibold">${report.revenue}</h2></div>
        </section>
      )}

      <div className="grid items-stretch gap-8 xl:grid-cols-2">
        <article className="flex h-full flex-col rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
          <h2 className="font-display text-3xl text-slate-950">Announcements</h2>
          <p className="mt-2 min-h-[48px] text-sm text-slate-600">Broadcast a notice to every member. Title and message are required.</p>
          <form onSubmit={sendAnnouncement} className="mt-4 flex flex-1 flex-col gap-4" noValidate>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Title</span>
              <input
                placeholder="Announcement title"
                value={announcement.title}
                onChange={(event) => setAnnouncement({ ...announcement, title: event.target.value })}
              />
              {announcementErrors.title && <p className="mt-1 text-sm text-rose-600">{announcementErrors.title}</p>}
            </label>
            <label className="block flex-1">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Message</span>
              <textarea
                rows="4"
                className="min-h-[120px]"
                placeholder="Announcement message"
                value={announcement.message}
                onChange={(event) => setAnnouncement({ ...announcement, message: event.target.value })}
              />
              {announcementErrors.message && <p className="mt-1 text-sm text-rose-600">{announcementErrors.message}</p>}
            </label>
            <button type="submit" className="mt-auto w-full rounded-2xl bg-teal-600 px-4 py-3 font-semibold text-white">
              Send announcement
            </button>
          </form>
        </article>
        <article className="flex h-full flex-col rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
          <h2 className="font-display text-3xl text-slate-950">Overdue reminders</h2>
          <p className="mt-2 min-h-[48px] text-sm text-slate-600">Send overdue email reminders and in-app notifications. The demo member already has an overdue copy of The Hobbit.</p>
          <div className="mt-4 flex flex-1 flex-col justify-end">
            <button
              onClick={handleSendOverdueReminders}
              disabled={isRemindersLoading}
              className="w-full rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRemindersLoading ? 'Sending...' : 'Send reminders'}
            </button>
          </div>
        </article>
      </div>

      <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl text-slate-950">Inventory Records</h2>
            <p className="mt-2 text-sm text-slate-600">{books.length} books in catalog</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingBookId(null);
              setBookForm(initialBook);
              setBookErrors({});
              setShowBookModal(true);
            }}
            className="rounded-2xl bg-amber-400 px-5 py-3 font-semibold text-slate-950"
          >
            Add Book
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3">Title</th>
                <th className="pb-3">ISBN</th>
                <th className="pb-3">Genre</th>
                <th className="pb-3">Year</th>
                <th className="pb-3">Availability</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book._id} className="border-t border-slate-200 align-top">
                  <td className="py-4">
                    <p className="font-semibold text-slate-900">{book.title}</p>
                    <p className="text-xs text-slate-500">{book.author}</p>
                  </td>
                  <td className="py-4 text-slate-700">{book.isbn}</td>
                  <td className="py-4 text-slate-700">{book.genre}</td>
                  <td className="py-4 text-slate-700">{book.publicationYear}</td>
                  <td className="py-4 text-slate-700">{book.availableCopies}/{book.totalCopies}</td>
                  <td className="py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {book.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditBook(book)}
                        className="rounded-full bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-950"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBook(book)}
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
      </section>

      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/60 bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl text-slate-950">{editingBookId ? 'Edit Book' : 'Add Book'}</h2>
                <p className="text-sm text-slate-600">Publication year must be between {MIN_PUBLICATION_YEAR} and {CURRENT_YEAR}.</p>
              </div>
              <button type="button" onClick={resetBookForm} className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700">
                Close
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdateBook} className="mt-6 space-y-4" noValidate>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">Book Title</span>
                <div>
                  <input value={bookForm.title} onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })} />
                  {bookErrors.title && <p className="mt-1 text-sm text-rose-600">{bookErrors.title}</p>}
                </div>
              </label>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">Author Name</span>
                <div>
                  <input value={bookForm.author} onChange={(event) => setBookForm({ ...bookForm, author: event.target.value })} />
                  {bookErrors.author && <p className="mt-1 text-sm text-rose-600">{bookErrors.author}</p>}
                </div>
              </label>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">ISBN Number</span>
                <div>
                  <input value={bookForm.isbn} onChange={(event) => setBookForm({ ...bookForm, isbn: event.target.value })} />
                  {bookErrors.isbn && <p className="mt-1 text-sm text-rose-600">{bookErrors.isbn}</p>}
                </div>
              </label>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">Genre</span>
                <div>
                  <input value={bookForm.genre} onChange={(event) => setBookForm({ ...bookForm, genre: event.target.value })} />
                  {bookErrors.genre && <p className="mt-1 text-sm text-rose-600">{bookErrors.genre}</p>}
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
                  {bookErrors.publicationYear && <p className="mt-1 text-sm text-rose-600">{bookErrors.publicationYear}</p>}
                </div>
              </label>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">Total Copies</span>
                <div>
                  <input type="number" min="1" value={bookForm.totalCopies} onChange={(event) => setBookForm({ ...bookForm, totalCopies: event.target.value })} />
                  {bookErrors.totalCopies && <p className="mt-1 text-sm text-rose-600">{bookErrors.totalCopies}</p>}
                </div>
              </label>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">Available Copies</span>
                <div>
                  <input type="number" min="0" value={bookForm.availableCopies} onChange={(event) => setBookForm({ ...bookForm, availableCopies: event.target.value })} />
                  {bookErrors.availableCopies && <p className="mt-1 text-sm text-rose-600">{bookErrors.availableCopies}</p>}
                </div>
              </label>
              <label className="grid items-start gap-3 md:grid-cols-[180px,1fr]">
                <span className="pt-3 text-sm font-semibold text-slate-700">Description</span>
                <textarea rows="4" value={bookForm.description} onChange={(event) => setBookForm({ ...bookForm, description: event.target.value })} />
              </label>
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">
                  {editingBookId ? 'Update Book' : 'Create Book'}
                </button>
                <button type="button" onClick={resetBookForm} className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

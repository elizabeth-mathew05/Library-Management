import { useEffect, useState } from 'react';
import api from '../api/client.js';

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
  const [message, setMessage] = useState('');
  const [isRemindersLoading, setIsRemindersLoading] = useState(false);

  const loadAdminData = async () => {
    const [reportResponse, booksResponse] = await Promise.all([
      api.get('/reports/dashboard'),
      api.get('/books')
    ]);

    setReport(reportResponse.data);
    setBooks(booksResponse.data);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const resetBookForm = () => {
    setBookForm(initialBook);
    setEditingBookId(null);
    setShowBookModal(false);
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
        setMessage('Book updated');
      } else {
        await api.post('/books', payload);
        setMessage('Book created');
      }

      resetBookForm();
      loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save book');
    }
  };

  const handleEditBook = (book) => {
    setEditingBookId(book._id);
    setShowBookModal(true);
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
    setMessage(`Editing ${book.title}`);
  };

  const handleDeleteBook = async (book) => {
    const confirmed = window.confirm(`Delete "${book.title}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/books/${book._id}`);
      setMessage('Book deleted');

      if (editingBookId === book._id) {
        resetBookForm();
      }

      loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete book');
    }
  };

  const handleSendOverdueReminders = async () => {
    setIsRemindersLoading(true);
    try {
      const response = await api.post('/borrows/overdue-reminders');
      setMessage(`✓ ${response.data.message}. ${response.data.remindersSent} reminders sent.`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to send reminders');
    } finally {
      setIsRemindersLoading(false);
    }
  };

  const sendAnnouncement = async (event) => {
    event.preventDefault();
    try {
      await api.post('/notifications/announcements', announcement);
      setAnnouncement({ title: '', message: '' });
      setMessage('Announcement sent');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to send announcement');
    }
  };

  const triggerOverdueReminders = async () => {
    try {
      const { data } = await api.post('/borrows/overdue-reminders');
      setMessage(data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to send reminders');
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-teal-800 px-8 py-10 text-white shadow-2xl shadow-slate-400/20">
        <h1 className="font-display text-5xl">Admin control center</h1>
        <p className="mt-3 max-w-3xl text-slate-200">Create books, review operations metrics, send announcements, and trigger overdue reminders.</p>
        {message && <p className="mt-4 text-sm text-teal-200">{message}</p>}
      </section>

      {report && (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl bg-white p-6 shadow-lg"><p className="text-sm text-slate-500">Books</p><h2 className="mt-2 text-3xl font-semibold">{report.totalBooks}</h2></div>
          <div className="rounded-3xl bg-white p-6 shadow-lg"><p className="text-sm text-slate-500">Users</p><h2 className="mt-2 text-3xl font-semibold">{report.totalUsers}</h2></div>
          <div className="rounded-3xl bg-white p-6 shadow-lg"><p className="text-sm text-slate-500">Borrows</p><h2 className="mt-2 text-3xl font-semibold">{report.activeBorrows}</h2></div>
          <div className="rounded-3xl bg-white p-6 shadow-lg"><p className="text-sm text-slate-500">Overdue</p><h2 className="mt-2 text-3xl font-semibold">{report.overdueBooks}</h2></div>
          <div className="rounded-3xl bg-white p-6 shadow-lg"><p className="text-sm text-slate-500">Revenue</p><h2 className="mt-2 text-3xl font-semibold">${report.revenue}</h2></div>
        </section>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl text-slate-950">Book Inventory</h2>
              <p className="mt-2 text-sm text-slate-600">Add, update, and maintain catalog records with live availability status.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingBookId(null);
                setBookForm(initialBook);
                setShowBookModal(true);
              }}
              className="rounded-2xl bg-amber-400 px-5 py-3 font-semibold text-slate-950"
            >
              Add Book
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <article className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
            <h2 className="font-display text-3xl text-slate-950">Announcements</h2>
            <form onSubmit={sendAnnouncement} className="mt-4 space-y-4">
              <input placeholder="Announcement title" value={announcement.title} onChange={(event) => setAnnouncement({ ...announcement, title: event.target.value })} />
              <textarea rows="4" placeholder="Announcement message" value={announcement.message} onChange={(event) => setAnnouncement({ ...announcement, message: event.target.value })} />
              <button type="submit" className="rounded-2xl bg-teal-600 px-4 py-3 font-semibold text-white">
                Send announcement
              </button>
            </form>
          </article>
          <article className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
            <h2 className="font-display text-3xl text-slate-950">Overdue reminders</h2>
            <p className="mt-2 text-slate-600">Trigger overdue email reminders and in-app notifications.</p>
            <button 
              onClick={handleSendOverdueReminders}
              disabled={isRemindersLoading}
              className="mt-5 rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRemindersLoading ? 'Sending...' : 'Send reminders'}
            </button>
          </article>
          <article className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-3xl text-slate-950">Inventory Records</h2>
              <p className="text-sm text-slate-600">{books.length} books in catalog</p>
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
          </article>
        </section>
      </div>

      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/60 bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl text-slate-950">{editingBookId ? 'Edit Book' : 'Add Book'}</h2>
                <p className="text-sm text-slate-600">Manage inventory in a focused modal without expanding the page.</p>
              </div>
              <button type="button" onClick={resetBookForm} className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700">
                Close
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdateBook} className="mt-6 space-y-4">
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">Book Title</span>
                <input value={bookForm.title} onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })} />
              </label>
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">Author Name</span>
                <input value={bookForm.author} onChange={(event) => setBookForm({ ...bookForm, author: event.target.value })} />
              </label>
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">ISBN Number</span>
                <input value={bookForm.isbn} onChange={(event) => setBookForm({ ...bookForm, isbn: event.target.value })} />
              </label>
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">Genre</span>
                <input value={bookForm.genre} onChange={(event) => setBookForm({ ...bookForm, genre: event.target.value })} />
              </label>
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">Publication Year</span>
                <input type="number" value={bookForm.publicationYear} onChange={(event) => setBookForm({ ...bookForm, publicationYear: event.target.value })} />
              </label>
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">Total Copies</span>
                <input type="number" value={bookForm.totalCopies} onChange={(event) => setBookForm({ ...bookForm, totalCopies: event.target.value })} />
              </label>
              <label className="grid items-center gap-3 md:grid-cols-[180px,1fr]">
                <span className="text-sm font-semibold text-slate-700">Available Copies</span>
                <input type="number" value={bookForm.availableCopies} onChange={(event) => setBookForm({ ...bookForm, availableCopies: event.target.value })} />
              </label>
              <label className="grid gap-3 md:grid-cols-[180px,1fr]">
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

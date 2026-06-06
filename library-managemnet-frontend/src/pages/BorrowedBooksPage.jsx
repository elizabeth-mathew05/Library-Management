import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function BorrowedBooksPage() {
  const [borrows, setBorrows] = useState([]);
  const [message, setMessage] = useState('');

  const loadBorrows = async () => {
    const { data } = await api.get('/borrows');
    setBorrows(data);
  };

  useEffect(() => {
    loadBorrows();
  }, []);

  const handleReturn = async (borrowId) => {
    try {
      await api.patch(`/borrows/${borrowId}/return`);
      setMessage('Book returned successfully');
      loadBorrows();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to return book');
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h1 className="font-display text-4xl text-slate-950">Borrowed Books</h1>
        <p className="mt-2 text-slate-600">View due dates, late fees, and return your borrowed books.</p>
      </div>

      {message && (
        <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </p>
      )}

      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3">Book</th>
                <th className="pb-3">Borrowed Date</th>
                <th className="pb-3">Due Date</th>
                <th className="pb-3">Returned Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Late Fee</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {borrows.map((borrow) => (
                <tr key={borrow._id} className="border-t border-slate-200">
                  <td className="py-4">
                    <p className="font-semibold text-slate-900">{borrow.book?.title}</p>
                    <p className="text-xs text-slate-500">{borrow.book?.author}</p>
                  </td>
                  <td className="py-4">{new Date(borrow.borrowedAt).toLocaleDateString()}</td>
                  <td className="py-4">{new Date(borrow.dueDate).toLocaleDateString()}</td>
                  <td className="py-4">{borrow.returnedAt ? new Date(borrow.returnedAt).toLocaleDateString() : '-'}</td>
                  <td className="py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {borrow.status}
                    </span>
                  </td>
                  <td className="py-4">${borrow.lateFee || 0}</td>
                  <td className="py-4">
                    {!borrow.returnedAt ? (
                      <button
                        onClick={() => handleReturn(borrow._id)}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Return Book
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

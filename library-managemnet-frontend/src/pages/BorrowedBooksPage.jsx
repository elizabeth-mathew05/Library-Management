import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function BorrowedBooksPage() {
  const { user } = useAuth();
  const isMember = user?.role === 'user';
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

  const calculateDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (borrow) => {
    if (borrow.returnedAt) return 'bg-slate-100 text-slate-700';
    if (borrow.status === 'overdue') return 'bg-rose-100 text-rose-700';
    const daysRemaining = calculateDaysRemaining(borrow.dueDate);
    if (daysRemaining <= 3) return 'bg-amber-100 text-amber-700';
    return 'bg-teal-100 text-teal-700';
  };

  const getStatusLabel = (borrow) => {
    if (borrow.returnedAt) return 'returned';
    if (borrow.status === 'overdue') return `overdue by ${Math.abs(calculateDaysRemaining(borrow.dueDate))} days`;
    const daysRemaining = calculateDaysRemaining(borrow.dueDate);
    return daysRemaining <= 0 ? 'overdue' : `${daysRemaining} days left`;
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h1 className="font-display text-4xl text-slate-950">Borrowed Books</h1>
        <p className="mt-2 text-slate-600">View due dates, late fees, and return your borrowed books. Overdue items are highlighted for immediate attention.</p>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg bg-teal-50 p-3 border border-teal-200">
            <p className="text-teal-700 font-semibold">Active Borrows</p>
            <p className="text-2xl font-bold text-teal-900">{borrows.filter(b => !b.returnedAt).length}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
            <p className="text-amber-700 font-semibold">Due Soon</p>
            <p className="text-2xl font-bold text-amber-900">{borrows.filter(b => !b.returnedAt && calculateDaysRemaining(b.dueDate) <= 3 && calculateDaysRemaining(b.dueDate) > 0).length}</p>
          </div>
          <div className="rounded-lg bg-rose-50 p-3 border border-rose-200">
            <p className="text-rose-700 font-semibold">Overdue</p>
            <p className="text-2xl font-bold text-rose-900">{borrows.filter(b => !b.returnedAt && b.status === 'overdue').length}</p>
          </div>
        </div>
      </div>

      {message && (
        <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </p>
      )}

      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Borrowing Status</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500 border-b border-slate-200">
              <tr>
                <th className="pb-3 font-semibold">Book</th>
                <th className="pb-3 font-semibold">Borrowed</th>
                <th className="pb-3 font-semibold">Due Date</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Late Fee</th>
                <th className="pb-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {borrows.map((borrow) => (
                <tr key={borrow._id} className="border-t border-slate-200 hover:bg-slate-50 transition">
                  <td className="py-4">
                    <p className="font-semibold text-slate-900">{borrow.book?.title}</p>
                    <p className="text-xs text-slate-500">{borrow.book?.author}</p>
                  </td>
                  <td className="py-4 text-slate-600">{new Date(borrow.borrowedAt).toLocaleDateString()}</td>
                  <td className="py-4">
                    <p className={`font-semibold ${borrow.returnedAt ? 'text-slate-400' : borrow.status === 'overdue' ? 'text-rose-700' : calculateDaysRemaining(borrow.dueDate) <= 3 ? 'text-amber-700' : 'text-slate-900'}`}>
                      {new Date(borrow.dueDate).toLocaleDateString()}
                    </p>
                    {borrow.returnedAt && <p className="text-xs text-slate-500">Returned: {new Date(borrow.returnedAt).toLocaleDateString()}</p>}
                  </td>
                  <td className="py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusColor(borrow)}`}>
                      {getStatusLabel(borrow)}
                    </span>
                  </td>
                  <td className="py-4">
                    <p className={`font-semibold ${borrow.lateFee > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                      ${(borrow.lateFee || 0).toFixed(2)}
                    </p>
                  </td>
                  <td className="py-4">
                      {!borrow.returnedAt && isMember ? (
                      <button
                        onClick={() => handleReturn(borrow._id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          borrow.status === 'overdue'
                            ? 'bg-rose-600 text-white hover:bg-rose-700'
                            : 'bg-slate-950 text-white hover:bg-slate-800'
                        }`}
                      >
                        Return
                      </button>
                      ) : !borrow.returnedAt ? (
                        <span className="text-xs text-slate-500">View only</span>
                    ) : (
                      <span className="text-xs text-slate-500">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {borrows.length === 0 && (
            <p className="py-8 text-center text-slate-500">No borrowed books at the moment.</p>
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">Borrowing Guidelines</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>• <strong>Borrow Limit:</strong> Maximum 3 books at a time</li>
          <li>• <strong>Borrowing Period:</strong> 14 days from borrow date</li>
          <li>• <strong>Late Fee:</strong> $2 per day after due date</li>
          <li>• <strong>Overdue Reminder:</strong> You'll receive email notifications for overdue books</li>
        </ul>
      </div>
    </section>
  );
}

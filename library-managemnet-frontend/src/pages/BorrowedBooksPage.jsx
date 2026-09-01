import { useEffect, useState } from 'react';
import api from '../api/client.js';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../utils/validation.js';

const LATE_FEE_PER_DAY = 2;

export default function BorrowedBooksPage() {
  const { user } = useAuth();
  const isMember = user?.role === 'user';
  const isStaff = user?.role === 'librarian' || user?.role === 'admin';
  const [borrows, setBorrows] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [processingReturnId, setProcessingReturnId] = useState(null);
  const [processingPaymentId, setProcessingPaymentId] = useState(null);

  const showNotice = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const loadBorrows = async () => {
    const { data } = await api.get('/borrows');
    setBorrows(data);
  };

  useEffect(() => {
    loadBorrows();
  }, []);

  const handleReturn = async (borrowId) => {
    if (processingReturnId) {
      return;
    }

    setProcessingReturnId(borrowId);

    try {
      const { data } = await api.patch(`/borrows/${borrowId}/return`);
      const fee = Number(data.lateFee || 0);
      showNotice(fee > 0 ? `Book returned. Late fee due: $${fee.toFixed(2)}.` : 'Book returned successfully', fee > 0 ? 'info' : 'success');
      loadBorrows();
    } catch (error) {
      showNotice(getApiErrorMessage(error, 'Unable to return book'), 'error');
    } finally {
      setProcessingReturnId(null);
    }
  };

  const handlePayLateFee = async (borrowId) => {
    if (processingPaymentId) {
      return;
    }

    setProcessingPaymentId(borrowId);

    try {
      await api.post('/payments/late-fee', { borrowId });
      showNotice('Late fee paid successfully.', 'success');
      loadBorrows();
    } catch (error) {
      showNotice(getApiErrorMessage(error, 'Unable to pay late fee'), 'error');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const calculateDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const getDisplayedLateFee = (borrow) => {
    if (borrow.returnedAt) {
      return Number(borrow.lateFee || 0);
    }

    const daysRemaining = calculateDaysRemaining(borrow.dueDate);
    if (daysRemaining >= 0) {
      return 0;
    }

    return Math.abs(daysRemaining) * LATE_FEE_PER_DAY;
  };

  const getStatusColor = (borrow) => {
    if (borrow.returnedAt) return 'bg-slate-100 text-slate-700';
    if (borrow.status === 'overdue' || calculateDaysRemaining(borrow.dueDate) < 0) return 'bg-rose-100 text-rose-700';
    const daysRemaining = calculateDaysRemaining(borrow.dueDate);
    if (daysRemaining <= 3) return 'bg-amber-100 text-amber-700';
    return 'bg-teal-100 text-teal-700';
  };

  const getStatusLabel = (borrow) => {
    if (borrow.returnedAt) return 'returned';
    const daysRemaining = calculateDaysRemaining(borrow.dueDate);
    if (daysRemaining < 0) return `overdue by ${Math.abs(daysRemaining)} days`;
    return `${daysRemaining} days left`;
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h1 className="font-display text-4xl text-slate-950">Borrowed Books</h1>
        <p className="mt-2 text-slate-600">
          {isStaff
            ? 'Monitor circulation and process returns for active borrow records.'
            : 'View due dates, accruing late fees, return books, and pay outstanding fines.'}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
            <p className="font-semibold text-teal-700">Active Borrows</p>
            <p className="text-2xl font-bold text-teal-900">{borrows.filter((item) => !item.returnedAt).length}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="font-semibold text-amber-700">Due Soon</p>
            <p className="text-2xl font-bold text-amber-900">{borrows.filter((item) => !item.returnedAt && calculateDaysRemaining(item.dueDate) <= 3 && calculateDaysRemaining(item.dueDate) > 0).length}</p>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
            <p className="font-semibold text-rose-700">Overdue</p>
            <p className="text-2xl font-bold text-rose-900">{borrows.filter((item) => !item.returnedAt && calculateDaysRemaining(item.dueDate) < 0).length}</p>
          </div>
        </div>
      </div>

      <StatusMessage type={messageType}>{message}</StatusMessage>

      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Borrowing Status</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
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
              {borrows.map((borrow) => {
                const displayedFee = getDisplayedLateFee(borrow);
                const canPay = Boolean(borrow.returnedAt && displayedFee > 0 && !borrow.lateFeePaid);

                return (
                  <tr key={borrow._id} className="border-t border-slate-200 transition hover:bg-slate-50">
                    <td className="py-4">
                      <p className="font-semibold text-slate-900">{borrow.book?.title}</p>
                      <p className="text-xs text-slate-500">{borrow.book?.author}</p>
                    </td>
                    <td className="py-4 text-slate-600">{new Date(borrow.borrowedAt).toLocaleDateString()}</td>
                    <td className="py-4">
                      <p className={`font-semibold ${borrow.returnedAt ? 'text-slate-400' : calculateDaysRemaining(borrow.dueDate) < 0 ? 'text-rose-700' : calculateDaysRemaining(borrow.dueDate) <= 3 ? 'text-amber-700' : 'text-slate-900'}`}>
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
                      <p className={`font-semibold ${displayedFee > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                        ${displayedFee.toFixed(2)}
                      </p>
                      {borrow.lateFeePaid && <p className="text-xs text-teal-700">Paid</p>}
                      {!borrow.returnedAt && displayedFee > 0 && <p className="text-xs text-slate-500">Accruing</p>}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        {!borrow.returnedAt && (isMember || isStaff) ? (
                          <button
                            onClick={() => handleReturn(borrow._id)}
                            disabled={processingReturnId === borrow._id}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                              processingReturnId === borrow._id
                                ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                                : calculateDaysRemaining(borrow.dueDate) < 0
                                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                                  : 'bg-slate-950 text-white hover:bg-slate-800'
                            }`}
                          >
                            {processingReturnId === borrow._id ? 'Processing...' : isStaff ? 'Process Return' : 'Return'}
                          </button>
                        ) : null}
                        {canPay && isMember ? (
                          <button
                            onClick={() => handlePayLateFee(borrow._id)}
                            disabled={processingPaymentId === borrow._id}
                            className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                          >
                            {processingPaymentId === borrow._id ? 'Paying...' : 'Pay late fee'}
                          </button>
                        ) : null}
                        {borrow.returnedAt && !canPay ? (
                          <span className="text-xs text-slate-500">{borrow.lateFeePaid ? 'Fee settled' : 'Completed'}</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {borrows.length === 0 && (
            <p className="py-8 text-center text-slate-500">No borrowed books at the moment.</p>
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h2 className="mb-3 text-xl font-semibold text-slate-900">Borrowing Guidelines</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>• <strong>Borrow Limit:</strong> Maximum 3 books at a time</li>
          <li>• <strong>Borrowing Period:</strong> 14 days from borrow date</li>
          <li>• <strong>Late Fee:</strong> $2 per day after due date</li>
          <li>• <strong>Demo overdue:</strong> Sign in as the demo user to see The Hobbit already overdue and Moby-Dick with an unpaid $10 fee.</li>
        </ul>
      </div>
    </section>
  );
}

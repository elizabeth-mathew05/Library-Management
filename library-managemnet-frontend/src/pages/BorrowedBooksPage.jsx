import { useEffect, useState } from 'react';
import api from '../api/client.js';
import PaymentCheckout from '../components/PaymentCheckout.jsx';
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
  const [checkout, setCheckout] = useState(null);

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

  const openCheckout = (borrow) => {
    setCheckout({
      borrowId: borrow._id,
      amount: getDisplayedLateFee(borrow),
      bookTitle: borrow.book?.title
    });
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
    if (borrow.returnedAt) return 'bg-slate-800 text-white';
    if (borrow.status === 'overdue' || calculateDaysRemaining(borrow.dueDate) < 0) return 'bg-rose-800 text-white';
    const daysRemaining = calculateDaysRemaining(borrow.dueDate);
    if (daysRemaining <= 3) return 'bg-amber-200 text-amber-950';
    return 'bg-teal-800 text-white';
  };

  const getStatusLabel = (borrow) => {
    if (borrow.returnedAt) return 'returned';
    const daysRemaining = calculateDaysRemaining(borrow.dueDate);
    if (daysRemaining < 0) return `overdue by ${Math.abs(daysRemaining)} days`;
    return `${daysRemaining} days left`;
  };

  return (
    <section className="space-y-6">
      {checkout && (
        <PaymentCheckout
          borrowId={checkout.borrowId}
          amount={checkout.amount}
          bookTitle={checkout.bookTitle}
          onClose={() => setCheckout(null)}
          onSuccess={(text) => {
            setCheckout(null);
            showNotice(text, 'success');
            loadBorrows();
          }}
        />
      )}

      <div className="page-card">
        <h1 className="page-title">Borrowed Books</h1>
        <p className="page-copy mt-2">
          {isStaff
            ? 'Monitor circulation and process returns for active borrow records.'
            : 'View due dates, accruing late fees, return books, and pay outstanding fines.'}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-teal-800 bg-teal-50 p-3">
            <p className="font-bold text-teal-950">Active Borrows</p>
            <p className="text-2xl font-bold text-slate-950">{borrows.filter((item) => !item.returnedAt).length}</p>
          </div>
          <div className="rounded-lg border border-amber-800 bg-amber-50 p-3">
            <p className="font-bold text-amber-950">Due Soon</p>
            <p className="text-2xl font-bold text-slate-950">{borrows.filter((item) => !item.returnedAt && calculateDaysRemaining(item.dueDate) <= 3 && calculateDaysRemaining(item.dueDate) > 0).length}</p>
          </div>
          <div className="rounded-lg border border-rose-800 bg-rose-50 p-3">
            <p className="font-bold text-rose-950">Overdue</p>
            <p className="text-2xl font-bold text-slate-950">{borrows.filter((item) => !item.returnedAt && calculateDaysRemaining(item.dueDate) < 0).length}</p>
          </div>
        </div>
      </div>

      <StatusMessage type={messageType}>{message}</StatusMessage>

      <div className="page-card">
        <h2 className="mb-4 text-xl font-semibold text-slate-950">Borrowing Status</h2>
        <div className="space-y-3 md:hidden">
          {borrows.map((borrow) => {
            const displayedFee = getDisplayedLateFee(borrow);
            const canPay = Boolean(borrow.returnedAt && displayedFee > 0 && !borrow.lateFeePaid);
            return (
              <article key={borrow._id} className="rounded-xl border border-slate-300 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{borrow.book?.title}</p>
                <p className="text-sm text-slate-800">{borrow.book?.author}</p>
                <p className="mt-2 text-sm text-slate-800">Due {new Date(borrow.dueDate).toLocaleDateString()}</p>
                <p className="mt-2">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusColor(borrow)}`}>
                    {getStatusLabel(borrow)}
                  </span>
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">${displayedFee.toFixed(2)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!borrow.returnedAt && (isMember || isStaff) ? (
                    <button onClick={() => handleReturn(borrow._id)} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                      {isStaff ? 'Process Return' : 'Return'}
                    </button>
                  ) : null}
                  {canPay && isMember ? (
                    <button onClick={() => openCheckout(borrow)} className="rounded-full bg-teal-800 px-4 py-2 text-sm font-semibold text-white">
                      Pay late fee
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-300 text-slate-800">
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
                  <tr key={borrow._id} className="border-t border-slate-200">
                    <td className="py-4">
                      <p className="font-semibold text-slate-950">{borrow.book?.title}</p>
                      <p className="text-xs text-slate-800">{borrow.book?.author}</p>
                    </td>
                    <td className="py-4 text-slate-800">{new Date(borrow.borrowedAt).toLocaleDateString()}</td>
                    <td className="py-4">
                      <p className={`font-semibold ${borrow.returnedAt ? 'text-slate-700' : calculateDaysRemaining(borrow.dueDate) < 0 ? 'text-rose-800' : calculateDaysRemaining(borrow.dueDate) <= 3 ? 'text-amber-950' : 'text-slate-950'}`}>
                        {new Date(borrow.dueDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusColor(borrow)}`}>
                        {getStatusLabel(borrow)}
                      </span>
                    </td>
                    <td className="py-4 font-semibold text-slate-950">${displayedFee.toFixed(2)}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        {!borrow.returnedAt && (isMember || isStaff) ? (
                          <button
                            onClick={() => handleReturn(borrow._id)}
                            disabled={processingReturnId === borrow._id}
                            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300 disabled:text-slate-700"
                          >
                            {processingReturnId === borrow._id ? 'Processing...' : isStaff ? 'Process Return' : 'Return'}
                          </button>
                        ) : null}
                        {canPay && isMember ? (
                          <button onClick={() => openCheckout(borrow)} className="rounded-full bg-teal-800 px-4 py-2 text-sm font-semibold text-white">
                            Pay late fee
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {borrows.length === 0 && (
          <p className="py-8 text-center text-slate-800">No borrowed books at the moment.</p>
        )}
      </div>

      <div className="page-card">
        <h2 className="mb-3 text-xl font-semibold text-slate-950">Borrowing Guidelines</h2>
        <ul className="space-y-2 text-sm text-slate-800">
          <li>• <strong>Borrow Limit:</strong> Maximum 3 books at a time</li>
          <li>• <strong>Borrowing Period:</strong> 14 days from borrow date</li>
          <li>• <strong>Late Fee:</strong> $2 per day after due date</li>
          <li>• <strong>Demo overdue:</strong> Sign in as the demo user to see The Hobbit already overdue and Moby-Dick with an unpaid $10 fee.</li>
        </ul>
      </div>
    </section>
  );
}

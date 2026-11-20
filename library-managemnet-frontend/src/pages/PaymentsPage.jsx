import { useEffect, useState } from 'react';
import api from '../api/client.js';
import PaymentCheckout from '../components/PaymentCheckout.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../utils/validation.js';

export default function PaymentsPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'librarian' || user?.role === 'admin';
  const isMember = user?.role === 'user';
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');
  const [checkout, setCheckout] = useState(null);

  const loadPayments = () => {
    api.get('/payments')
      .then(({ data }) => setPayments(data))
      .catch((requestError) => setError(getApiErrorMessage(requestError, 'Unable to load payments')));
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const settledCount = payments.filter((payment) => (payment.status || '').toLowerCase() === 'paid').length;
  const pendingCount = payments.filter((payment) => (payment.status || '').toLowerCase() === 'pending').length;
  const totalAmount = payments
    .filter((payment) => (payment.status || '').toLowerCase() === 'paid')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <section className="space-y-6">
      {checkout && (
        <PaymentCheckout
          borrowId={checkout.borrowId}
          amount={checkout.amount}
          bookTitle={checkout.bookTitle}
          onClose={() => setCheckout(null)}
          onSuccess={() => {
            setCheckout(null);
            loadPayments();
          }}
        />
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="page-title">Payments</h1>
        <p className="mt-2 text-slate-700">
          {isStaff
            ? 'Track late-fee settlements across the library.'
            : 'Pay outstanding late fees through the library payment gateway, then confirm the settlement here.'}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-teal-700 bg-teal-50 p-3">
            <p className="text-sm font-semibold text-teal-900">Settled</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{settledCount}</p>
          </div>
          <div className="rounded-xl border border-amber-700 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-900">Pending</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-slate-400 bg-slate-100 p-3">
            <p className="text-sm font-semibold text-slate-800">
              {isStaff ? 'Total collected' : 'Total paid'}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950">${totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <StatusMessage type="error">{error}</StatusMessage>

      <div className="grid gap-4">
        {payments.map((payment) => (
          <article key={payment._id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">
                  {payment.borrow?.book?.title || `Payment #${payment._id.slice(-6)}`}
                </h2>
                <p className="text-sm text-slate-700">Status: {payment.status}</p>
                <p className="text-sm text-slate-700">Amount: ${Number(payment.amount || 0).toFixed(2)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className={`rounded-full px-4 py-2 text-sm font-semibold ${payment.status === 'paid' ? 'bg-teal-700 text-white' : payment.status === 'failed' ? 'bg-rose-700 text-white' : 'bg-amber-100 text-amber-950'}`}>
                  {payment.status === 'paid' ? 'Paid' : payment.status === 'failed' ? 'Failed' : 'Awaiting payment'}
                </div>
                {isMember && payment.status === 'pending' && payment.borrow?._id && (
                  <button
                    type="button"
                    onClick={() => setCheckout({
                      borrowId: payment.borrow._id,
                      amount: payment.amount,
                      bookTitle: payment.borrow?.book?.title
                    })}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Pay now
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
        {payments.length === 0 && !error && (
          <p className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
            No payments yet. Open Borrowed and choose Pay late fee to complete checkout with test card 4242 4242 4242 4242.
          </p>
        )}
      </div>
    </section>
  );
}

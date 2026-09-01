import { useEffect, useState } from 'react';
import api from '../api/client.js';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../utils/validation.js';

export default function PaymentsPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'librarian' || user?.role === 'admin';
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/payments')
      .then(({ data }) => setPayments(data))
      .catch((requestError) => setError(getApiErrorMessage(requestError, 'Unable to load payments')));
  }, []);

  const settledCount = payments.filter((payment) => (payment.status || '').toLowerCase() === 'paid').length;
  const pendingCount = payments.filter((payment) => (payment.status || '').toLowerCase() !== 'paid').length;
  const totalAmount = payments
    .filter((payment) => (payment.status || '').toLowerCase() === 'paid')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h1 className="font-display text-4xl text-slate-950">Payments</h1>
        <p className="mt-2 text-slate-600">
          {isStaff
            ? 'Track all payment intents and late-fee settlements across the library.'
            : 'Pay late fees from the Borrowed page, then confirm the settlement here.'}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Settled</p>
            <p className="mt-1 text-2xl font-bold text-teal-900">{settledCount}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
              {isStaff ? 'Total Collected' : 'Total Paid'}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">${totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <StatusMessage type="error">{error}</StatusMessage>

      <div className="grid gap-4">
        {payments.map((payment) => (
          <article key={payment._id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  {payment.borrow?.book?.title || `Payment #${payment._id.slice(-6)}`}
                </h2>
                <p className="text-sm text-slate-500">Status: {payment.status}</p>
                <p className="text-sm text-slate-500">Amount: ${Number(payment.amount || 0).toFixed(2)}</p>
              </div>
              <div className={`rounded-full px-4 py-2 text-sm font-semibold ${payment.status === 'paid' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'}`}>
                {payment.status === 'paid' ? 'Paid' : payment.stripePaymentIntentId || 'Awaiting intent'}
              </div>
            </div>
          </article>
        ))}
        {payments.length === 0 && !error && (
          <p className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No payments yet. Sign in as the demo user, open Borrowed, and pay the Moby-Dick late fee to test this page.
          </p>
        )}
      </div>
    </section>
  );
}

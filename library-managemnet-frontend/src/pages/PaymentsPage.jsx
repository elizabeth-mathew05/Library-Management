import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function PaymentsPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'librarian' || user?.role === 'admin';
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get('/payments').then(({ data }) => setPayments(data));
  }, []);

  const settledCount = payments.filter((payment) => (payment.status || '').toLowerCase() === 'succeeded').length;
  const pendingCount = payments.filter((payment) => (payment.status || '').toLowerCase() !== 'succeeded').length;
  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h1 className="font-display text-4xl text-slate-950">Payments</h1>
        <p className="mt-2 text-slate-600">
          {isStaff
            ? 'Track all payment intents and late-fee settlements across the library.'
            : 'Track your payment intents and late-fee settlements.'}
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
              {isStaff ? 'Total Collected Scope' : 'Total Paid'}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">${totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4">
        {payments.map((payment) => (
          <article key={payment._id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Payment #{payment._id.slice(-6)}</h2>
                <p className="text-sm text-slate-500">Status: {payment.status}</p>
                <p className="text-sm text-slate-500">Amount: ${payment.amount}</p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                {payment.stripePaymentIntentId || 'Awaiting intent'}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

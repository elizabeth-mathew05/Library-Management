import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get('/payments').then(({ data }) => setPayments(data));
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h1 className="font-display text-4xl text-slate-950">Payments</h1>
        <p className="mt-2 text-slate-600">Track payment intents and late-fee settlements.</p>
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

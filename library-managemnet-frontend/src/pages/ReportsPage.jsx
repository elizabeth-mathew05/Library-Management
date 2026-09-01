import { useEffect, useState } from 'react';
import api from '../api/client.js';
import StatusMessage from '../components/StatusMessage.jsx';
import { getApiErrorMessage } from '../utils/validation.js';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(({ data }) => setReport(data))
      .catch((requestError) => setError(getApiErrorMessage(requestError, 'Unable to load reports')));
  }, []);

  if (!report && !error) {
    return <p className="text-slate-600">Loading reports...</p>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h1 className="font-display text-4xl text-slate-950">Reports and analytics</h1>
        <p className="mt-2 text-slate-600">Inventory, circulation, overdue activity, and member usage for operational decisions.</p>
      </section>

      <StatusMessage type="error">{error}</StatusMessage>

      {report && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ['Books', report.totalBooks],
              ['Users', report.totalUsers],
              ['Active borrows', report.activeBorrows],
              ['Overdue', report.overdueBooks],
              ['Reservations', report.activeReservations]
            ].map(([label, value]) => (
              <article key={label} className="rounded-3xl bg-white p-5 shadow-lg">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
              </article>
            ))}
          </section>

          <div className="grid gap-8 xl:grid-cols-2">
            <article className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl">
              <h2 className="font-display text-3xl text-slate-950">Popular books</h2>
              <div className="mt-4 space-y-3">
                {(report.popularBooks || []).map((item) => (
                  <div key={item._id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.author}</p>
                    </div>
                    <p className="text-sm font-semibold text-teal-700">{item.borrowCount} borrows</p>
                  </div>
                ))}
                {!report.popularBooks?.length && <p className="text-sm text-slate-500">No borrowing data yet.</p>}
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl">
              <h2 className="font-display text-3xl text-slate-950">Inventory by genre</h2>
              <div className="mt-4 space-y-3">
                {(report.inventoryByGenre || []).map((item) => (
                  <div key={item._id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{item._id || 'Uncategorized'}</p>
                    <p className="text-sm text-slate-600">{item.count} titles / {item.available} copies available</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl">
            <h2 className="font-display text-3xl text-slate-950">Overdue books</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3">Borrower</th>
                    <th className="pb-3">Book</th>
                    <th className="pb-3">Due date</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.overdueList || []).map((item) => (
                    <tr key={item._id} className="border-t border-slate-200">
                      <td className="py-3">
                        <p className="font-semibold">{item.user?.name}</p>
                        <p className="text-xs text-slate-500">{item.user?.email}</p>
                      </td>
                      <td className="py-3">{item.book?.title}</td>
                      <td className="py-3 text-rose-700">{new Date(item.dueDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!report.overdueList?.length && <p className="mt-4 text-sm text-slate-500">No overdue items.</p>}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl">
            <h2 className="font-display text-3xl text-slate-950">User activity</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3">Member</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Borrows</th>
                    <th className="pb-3">Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.userActivity || []).map((item) => (
                    <tr key={item._id} className="border-t border-slate-200">
                      <td className="py-3">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.email}</p>
                      </td>
                      <td className="py-3 capitalize">{item.role}</td>
                      <td className="py-3">{item.borrowCount}</td>
                      <td className="py-3">{item.overdueCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}
    </div>
  );
}

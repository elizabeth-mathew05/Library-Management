import { useEffect, useState } from 'react';
import api from '../api/client.js';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setProfileData(data));

    if (user?.role !== 'user') {
      api.get('/reports/dashboard').then(({ data }) => setReport(data)).catch(() => setReport(null));
    }
  }, [user?.role]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-slate-950 px-8 py-10 text-white shadow-2xl shadow-slate-400/30">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Library operations hub</p>
        <h1 className="mt-3 font-display text-5xl">Manage books, users, reservations, reviews, and fines.</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-300">
          Monitor overdue books, process returns, send announcements, and keep the collection searchable and available.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Role" value={user?.role || 'user'} helper="Role-based access control is enabled." />
        <StatCard title="Borrowed books" value={profileData?.borrowingHistory?.length || 0} helper="Shows current and past transactions." />
        <StatCard title="Reservations" value={profileData?.reservations?.length || 0} helper="Queued and ready reservations." />
        <StatCard title="Notifications" value={profileData?.notifications?.length || 0} helper="Reservation and overdue reminders." />
      </section>

      {report && (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Books" value={report.totalBooks} helper="All catalogued titles in inventory." />
          <StatCard title="Active Borrows" value={report.activeBorrows} helper="Currently checked out books." />
          <StatCard title="Overdue" value={report.overdueBooks} helper="Books requiring reminder actions." />
          <StatCard title="Revenue" value={`$${report.revenue}`} helper="Collected late-fee payments." />
        </section>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const LATE_FEE_PER_DAY = 2;

const roleCopy = {
  user: {
    label: 'Member',
    helper: 'This account can borrow available books, reserve titles that are out of stock, and pay late fees.',
    capabilities: [
      'Borrow a book when copies are available.',
      'Reserve a book when it is checked out or already in high demand.',
      'Return books, see accruing late fees ($2/day), and pay fines from Borrowed.'
    ]
  },
  librarian: {
    label: 'Librarian',
    helper: 'This account manages circulation and the catalog. Admin-only settings are hidden.',
    capabilities: [
      'Add and update catalog records from Catalog.',
      'Process member returns from Issue & Return.',
      'Review reservations and outstanding fines.'
    ]
  },
  admin: {
    label: 'Admin',
    helper: 'This account can manage the catalog, announcements, reviews, and system metrics.',
    capabilities: [
      'Create announcements and trigger overdue reminders.',
      'Moderate reviews and maintain inventory.',
      'View library-wide overdue counts and late-fee revenue.'
    ]
  }
};

const daysUntilDue = (dueDate) => {
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

const lateFeeForBorrow = (borrow) => {
  if (borrow.returnedAt) {
    return Number(borrow.lateFee || 0);
  }

  const days = daysUntilDue(borrow.dueDate);
  return days < 0 ? Math.abs(days) * LATE_FEE_PER_DAY : 0;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const currentRole = user?.role || 'user';
  const access = roleCopy[currentRole] || roleCopy.user;

  const roleHero = {
    user: {
      eyebrow: 'Member dashboard',
      title: 'Track your borrowing, reservations, and payment history.',
      description: 'Use this area to keep up with due dates and manage your account activity.'
    },
    librarian: {
      eyebrow: 'Librarian desk',
      title: 'Handle circulation, reservations, and member support.',
      description: 'This workspace focuses on day-to-day desk operations and collection availability.'
    },
    admin: {
      eyebrow: 'System administration',
      title: 'Control policies, moderation, and overall library performance.',
      description: 'This dashboard includes administrative controls and high-level system metrics.'
    }
  };

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setProfileData(data));

    if (user?.role === 'admin' || user?.role === 'librarian') {
      api.get('/reports/dashboard').then(({ data }) => setReport(data)).catch(() => setReport(null));
    } else {
      setReport(null);
    }
  }, [user?.role]);

  const lateFeeSummary = useMemo(() => {
    const history = profileData?.borrowingHistory || [];
    const overdue = history.filter((item) => !item.returnedAt && daysUntilDue(item.dueDate) < 0);
    const unpaid = history.filter((item) => item.returnedAt && Number(item.lateFee || 0) > 0 && !item.lateFeePaid);
    const accruing = overdue.reduce((sum, item) => sum + lateFeeForBorrow(item), 0);
    const unpaidTotal = unpaid.reduce((sum, item) => sum + Number(item.lateFee || 0), 0);

    return {
      overdueCount: overdue.length,
      unpaidCount: unpaid.length,
      accruing,
      unpaidTotal
    };
  }, [profileData]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-slate-950 px-8 py-10 text-white shadow-2xl shadow-slate-400/30">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-300">{roleHero[currentRole].eyebrow}</p>
        <h1 className="mt-3 font-display text-5xl">{roleHero[currentRole].title}</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-300">
          {roleHero[currentRole].description}
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Signed in as"
          value={access.label}
          helper={access.helper}
        />
        <StatCard title="Borrowed books" value={profileData?.borrowingHistory?.length || 0} helper="Shows current and past transactions." />
        <StatCard title="Reservations" value={profileData?.reservations?.length || 0} helper="Queued reservations for unavailable titles." />
        <StatCard title="Notifications" value={profileData?.notifications?.length || 0} helper="Reservation and overdue reminders." />
      </section>

      <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h2 className="font-display text-3xl text-slate-950">What this account can do</h2>
        <p className="mt-2 text-sm text-slate-600">
          Menus and buttons change by account type. You are signed in as <strong>{access.label}</strong>, so you can:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {access.capabilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {currentRole === 'user' && (
        <section className="rounded-[2rem] border border-rose-100 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-slate-950">Late fees</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Overdue books accrue ${LATE_FEE_PER_DAY} per day. Return an overdue title to lock the fee, then pay it from Borrowed.
                The demo member already has an overdue copy of The Hobbit and an unpaid $10 fee on Moby-Dick.
              </p>
            </div>
            <Link to="/borrowed" className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white">
              Open Borrowed
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-700">Overdue now</p>
              <p className="mt-1 text-3xl font-bold text-rose-900">{lateFeeSummary.overdueCount}</p>
              <p className="mt-1 text-xs text-rose-700">Accruing ${lateFeeSummary.accruing.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-700">Unpaid after return</p>
              <p className="mt-1 text-3xl font-bold text-amber-900">{lateFeeSummary.unpaidCount}</p>
              <p className="mt-1 text-xs text-amber-700">Due ${lateFeeSummary.unpaidTotal.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">How to test</p>
              <p className="mt-2 text-sm text-slate-600">Sign in as user1@gmail.com, open Borrowed, return The Hobbit, then pay the Moby-Dick fee.</p>
            </div>
          </div>
        </section>
      )}

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

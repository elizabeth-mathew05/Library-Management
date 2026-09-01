import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const roleLinks = {
  user: [
    { to: '/', label: 'Dashboard' },
    { to: '/books', label: 'Books' },
    { to: '/borrowed', label: 'Borrowed' },
    { to: '/reservations', label: 'Reservations' },
    { to: '/notifications', label: 'Notifications' },
    { to: '/payments', label: 'Payments' },
    { to: '/profile', label: 'Profile' }
  ],
  librarian: [
    { to: '/', label: 'Librarian Desk' },
    { to: '/books', label: 'Catalog' },
    { to: '/borrowed', label: 'Issue & Return' },
    { to: '/reservations', label: 'Reservations' },
    { to: '/reports', label: 'Reports' },
    { to: '/notifications', label: 'Notifications' },
    { to: '/payments', label: 'Fines' },
    { to: '/profile', label: 'Profile' }
  ],
  admin: [
    { to: '/', label: 'Dashboard' },
    { to: '/books', label: 'Catalog' },
    { to: '/admin', label: 'Admin Panel' },
    { to: '/admin/reviews', label: 'Reviews' },
    { to: '/reports', label: 'Reports' },
    { to: '/notifications', label: 'Notifications' },
    { to: '/payments', label: 'Payments' },
    { to: '/profile', label: 'Profile' }
  ]
};

const navClassName = ({ isActive }) =>
  `inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium ${
    isActive ? 'bg-teal-500 text-white' : 'bg-white/10 text-slate-100 hover:bg-white/20'
  }`;

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const visibleLinks = user ? roleLinks[user.role] || roleLinks.user : [];

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/40 bg-slate-950 text-white shadow-lg shadow-slate-900/10">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="font-display text-2xl tracking-wide text-teal-300">
              Library LMS
            </Link>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <span className="inline-flex h-10 items-center rounded-full bg-white/10 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-teal-200">
                    {user.role}
                  </span>
                  <button onClick={logout} className="inline-flex h-10 items-center rounded-full border border-white/20 px-4 text-sm hover:bg-white/10">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className="inline-flex h-10 items-center rounded-full px-4 text-sm hover:bg-white/10">
                    Login
                  </NavLink>
                  <NavLink to="/register" className="inline-flex h-10 items-center rounded-full bg-teal-500 px-4 text-sm">
                    Register
                  </NavLink>
                </>
              )}
            </div>
          </div>

          {user && (
            <nav className="mt-4 flex flex-wrap items-center gap-2">
              {visibleLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/' || link.to === '/admin'}
                  className={navClassName}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}

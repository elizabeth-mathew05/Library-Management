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
    { to: '/payments', label: 'Fines' },
    { to: '/profile', label: 'Profile' }
  ],
  admin: [
    { to: '/', label: 'Admin Dashboard' },
    { to: '/books', label: 'Catalog' },
    { to: '/admin', label: 'Admin Panel' },
    { to: '/admin/reviews', label: 'Review Queue' },
    { to: '/payments', label: 'Payments' },
    { to: '/profile', label: 'Profile' }
  ]
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const visibleLinks = user ? roleLinks[user.role] || roleLinks.user : [];

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/40 bg-slate-950 text-white shadow-lg shadow-slate-900/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="font-display text-3xl tracking-wide text-teal-300">
            Library Management System
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            {user &&
              visibleLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 ${isActive ? 'bg-teal-500 text-white' : 'bg-white/10 text-slate-100 hover:bg-white/20'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            {user ? (
              <button onClick={logout} className="rounded-full border border-white/20 px-4 py-2 hover:bg-white/10">
                Logout
              </button>
            ) : (
              <>
                <NavLink to="/login" className="rounded-full px-4 py-2 hover:bg-white/10">
                  Login
                </NavLink>
                <NavLink to="/register" className="rounded-full bg-teal-500 px-4 py-2">
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}

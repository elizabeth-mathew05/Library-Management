import { useState } from 'react';
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
  `flex min-h-11 w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold sm:w-auto ${
    isActive ? 'bg-teal-800 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
  }`;

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleLinks = user ? roleLinks[user.role] || roleLinks.user : [];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="shrink-0 font-display text-lg text-white sm:text-2xl">
              Library LMS
            </Link>
            <div className="flex items-center gap-2">
              {user && (
                <span className="hidden rounded-lg bg-teal-800 px-3 py-2 text-xs font-bold uppercase text-white md:inline-flex">
                  {user.role}
                </span>
              )}
              {user ? (
                <button onClick={logout} className="inline-flex min-h-11 items-center rounded-lg bg-white px-3 text-sm font-semibold text-slate-900">
                  Logout
                </button>
              ) : (
                <>
                  <NavLink to="/login" className="inline-flex min-h-11 items-center rounded-lg bg-white px-3 text-sm font-semibold text-slate-900">
                    Login
                  </NavLink>
                  <NavLink to="/register" className="inline-flex min-h-11 items-center rounded-lg bg-teal-800 px-3 text-sm font-semibold text-white">
                    Register
                  </NavLink>
                </>
              )}
              {user && (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-lg border border-white px-3 text-sm font-semibold text-white lg:hidden"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                >
                  {menuOpen ? 'Close' : 'Menu'}
                </button>
              )}
            </div>
          </div>

          {user && (
            <nav className={`${menuOpen ? 'mt-3 grid grid-cols-1 gap-2' : 'hidden'} lg:mt-3 lg:flex lg:flex-wrap lg:gap-2`}>
              {visibleLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/' || link.to === '/admin'}
                  className={navClassName}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

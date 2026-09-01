import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { emailPattern, getApiErrorMessage } from '../utils/validation.js';

const demoAccounts = [
  { role: 'Admin', email: 'admin@gmail.com', password: 'admin123' },
  { role: 'User', email: 'user1@gmail.com', password: 'user1@123' },
  { role: 'Librarian', email: 'librarian2@gmail.com', password: 'librarian2@123' }
];

function validateLoginForm(form) {
  const nextErrors = {};
  const email = form.email.trim();
  const password = form.password;

  if (!email) {
    nextErrors.email = 'Email is required.';
  } else if (!emailPattern.test(email)) {
    nextErrors.email = 'Enter a valid email address.';
  }

  if (!password) {
    nextErrors.password = 'Password is required.';
  } else if (password.length < 6) {
    nextErrors.password = 'Password must be at least 6 characters.';
  }

  return nextErrors;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetType, setResetType] = useState('info');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const nextErrors = validateLoginForm(form);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await login({
        email: form.email.trim(),
        password: form.password
      });
      navigate('/');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Login failed. Check the demo credentials below if you do not have an account.'));
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-300/40">
      <h1 className="font-display text-4xl text-slate-950">Welcome back</h1>
      <p className="mt-2 text-slate-500">Sign in to manage books, returns, payments, and reservations.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => {
              setForm({ ...form, email: event.target.value });
              if (fieldErrors.email) {
                setFieldErrors({ ...fieldErrors, email: '' });
              }
            }}
            className="w-full"
          />
          {fieldErrors.email && <p className="mt-1 text-sm text-rose-600">{fieldErrors.email}</p>}
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => {
              setForm({ ...form, password: event.target.value });
              if (fieldErrors.password) {
                setFieldErrors({ ...fieldErrors, password: '' });
              }
            }}
            className="w-full"
          />
          {fieldErrors.password && <p className="mt-1 text-sm text-rose-600">{fieldErrors.password}</p>}
        </div>

        <StatusMessage type="error">{error}</StatusMessage>

        <button type="submit" className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">
          Login
        </button>
      </form>

      <button
        type="button"
        onClick={() => setShowForgotPassword((open) => !open)}
        className="mt-4 text-sm font-semibold text-teal-700"
      >
        Forgot password?
      </button>

      {showForgotPassword && (
        <form
          className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setResetMessage('');

            if (!emailPattern.test(resetEmail.trim())) {
              setResetMessage('Enter a valid email address.');
              setResetType('error');
              return;
            }

            try {
              const { data } = await api.post('/auth/forgot-password', { email: resetEmail.trim() });
              setResetMessage(data.message || 'If an account exists, a reset link has been sent.');
              setResetType('success');
            } catch (requestError) {
              setResetMessage(getApiErrorMessage(requestError, 'Unable to send reset email.'));
              setResetType('error');
            }
          }}
        >
          <p className="text-sm text-slate-600">Enter your account email to receive a password reset link.</p>
          <input
            type="email"
            placeholder="Account email"
            value={resetEmail}
            onChange={(event) => setResetEmail(event.target.value)}
          />
          <StatusMessage type={resetType}>{resetMessage}</StatusMessage>
          <button type="submit" className="w-full rounded-2xl bg-teal-600 px-4 py-3 font-semibold text-white">
            Send reset link
          </button>
        </form>
      )}

      <aside className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Demo credentials</p>
        <p className="mt-1 text-xs text-slate-600">Use these seeded accounts to test every role. Click a button to fill the form.</p>
        <div className="mt-3 space-y-2">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setForm({ email: account.email, password: account.password });
                setFieldErrors({});
                setError('');
              }}
              className="flex w-full items-center justify-between rounded-xl border border-teal-200 bg-white px-3 py-2 text-left hover:bg-teal-50"
            >
              <span>
                <span className="font-semibold text-slate-900">{account.role}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{account.email} / {account.password}</span>
              </span>
              <span className="text-xs font-semibold text-teal-700">Use</span>
            </button>
          ))}
        </div>
      </aside>

      <p className="mt-6 text-sm text-slate-600">
        Need an account?{' '}
        <Link to="/register" className="font-semibold text-teal-700">Register here</Link>
      </p>
    </section>
  );
}

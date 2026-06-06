import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(form);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed');
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setError('If this email exists, a reset link was sent.');
      setForgotEmail('');
      setShowForgot(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send reset email');
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-300/40">
      <h1 className="font-display text-4xl text-slate-950">Welcome back</h1>
      <p className="mt-2 text-slate-500">Sign in to manage books, returns, payments, and reservations.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required className="w-full" />
        <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required className="w-full" />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button type="submit" className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">
          Login
        </button>
      </form>
      <button
        onClick={() => setShowForgot((prev) => !prev)}
        className="mt-3 text-sm font-semibold text-teal-700"
      >
        {showForgot ? 'Close forgot password' : 'Forgot password?'}
      </button>

      {showForgot && (
        <form onSubmit={handleForgotPassword} className="mt-4 space-y-3 rounded-2xl bg-slate-100 p-4">
          <input
            type="email"
            placeholder="Enter your account email"
            value={forgotEmail}
            onChange={(event) => setForgotEmail(event.target.value)}
            required
            className="w-full"
          />
          <button type="submit" className="w-full rounded-xl bg-teal-600 px-4 py-2 font-semibold text-white">
            Send reset link
          </button>
        </form>
      )}
      <p className="mt-6 text-sm text-slate-600">
        Need an account? <Link to="/register" className="font-semibold text-teal-700">Register here</Link>
      </p>
    </section>
  );
}

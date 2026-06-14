import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
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

  return (
    <section className="mx-auto max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-300/40">
      <h1 className="font-display text-4xl text-slate-950">Welcome back</h1>
      <p className="mt-2 text-slate-500">Sign in to manage books, returns, payments, and reservations.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
          className="w-full"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
          className="w-full"
        />

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button type="submit" className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">
          Login
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Need an account?{' '}
        <Link to="/register" className="font-semibold text-teal-700">Register here</Link>
      </p>
    </section>
  );
}

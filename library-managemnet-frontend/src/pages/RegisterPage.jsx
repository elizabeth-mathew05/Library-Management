import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await register(form);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <section className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-300/40">
      <h1 className="font-display text-4xl text-slate-950">Create account</h1>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
        <input placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required className="md:col-span-2" />
        <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required className="md:col-span-2" />
        <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
          <option value="user">User</option>
          <option value="librarian">Librarian</option>
          <option value="admin">Admin</option>
        </select>
        {error && <p className="text-sm text-rose-600 md:col-span-2">{error}</p>}
        <button type="submit" className="rounded-2xl bg-teal-600 px-4 py-3 font-semibold text-white md:col-span-2">
          Register
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        Already have an account? <Link to="/login" className="font-semibold text-teal-700">Login here</Link>
      </p>
    </section>
  );
}

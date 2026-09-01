import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { emailPattern, getApiErrorMessage } from '../utils/validation.js';

function validateRegisterForm(form) {
  const nextErrors = {};
  const name = form.name.trim();
  const email = form.email.trim();
  const password = form.password;
  const confirmPassword = form.confirmPassword;

  if (!name) {
    nextErrors.name = 'Full name is required.';
  } else if (name.length < 2) {
    nextErrors.name = 'Full name must be at least 2 characters.';
  } else if (name.length > 80) {
    nextErrors.name = 'Full name must be 80 characters or fewer.';
  }

  if (!email) {
    nextErrors.email = 'Email is required.';
  } else if (!emailPattern.test(email)) {
    nextErrors.email = 'Enter a valid email address.';
  }

  if (!password) {
    nextErrors.password = 'Password is required.';
  } else if (password.length < 6) {
    nextErrors.password = 'Password must be at least 6 characters.';
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    nextErrors.password = 'Password must include at least one letter and one number.';
  }

  if (!confirmPassword) {
    nextErrors.confirmPassword = 'Confirm your password.';
  } else if (confirmPassword !== password) {
    nextErrors.confirmPassword = 'Passwords do not match.';
  }

  return nextErrors;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const updateField = (field, value) => {
    setForm({ ...form, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const nextErrors = validateRegisterForm(form);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password
      });
      navigate('/');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Registration failed. Try a different email or use the demo accounts on the login page.'));
    }
  };

  return (
    <section className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-300/40">
      <h1 className="font-display text-4xl text-slate-950">Create account</h1>
      <p className="mt-2 text-sm text-slate-500">New accounts are created as members. Use the demo admin or librarian credentials on the login page to test staff tools.</p>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2" noValidate>
        <div className="md:col-span-2">
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            className="w-full"
          />
          {fieldErrors.name && <p className="mt-1 text-sm text-rose-600">{fieldErrors.name}</p>}
        </div>
        <div className="md:col-span-2">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="w-full"
          />
          {fieldErrors.email && <p className="mt-1 text-sm text-rose-600">{fieldErrors.email}</p>}
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            className="w-full"
          />
          {fieldErrors.password && <p className="mt-1 text-sm text-rose-600">{fieldErrors.password}</p>}
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={(event) => updateField('confirmPassword', event.target.value)}
            className="w-full"
          />
          {fieldErrors.confirmPassword && <p className="mt-1 text-sm text-rose-600">{fieldErrors.confirmPassword}</p>}
        </div>
        <div className="md:col-span-2">
          <StatusMessage type="error">{error}</StatusMessage>
        </div>
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

import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client.js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!token) {
      setMessage('Reset token is missing from the URL.');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setMessage('Password reset successful. You can now login.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to reset password');
    }
  };

  return (
    <section className="page-card mx-auto max-w-md">
      <h1 className="page-title">Reset password</h1>
      <p className="page-copy mt-2">Set a new account password using your email reset link.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          className="w-full"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          className="w-full"
        />
        {message && <p className="text-sm text-teal-700">{message}</p>}
        <button type="submit" className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">
          Reset password
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-800">
        Back to <Link to="/login" className="font-semibold text-teal-700">Login</Link>
      </p>
    </section>
  );
}

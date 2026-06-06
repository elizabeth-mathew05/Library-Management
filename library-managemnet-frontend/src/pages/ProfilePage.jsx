import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePage() {
  const { refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');

  const loadProfile = async () => {
    const { data } = await api.get('/auth/me');
    setProfile(data);
    setForm({
      name: data.user.name || '',
      phone: data.user.phone || '',
      address: data.user.address || ''
    });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    await api.put('/auth/profile', form);
    await refreshProfile();
    await loadProfile();
    setMessage('Profile updated');
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    await api.put('/auth/password', password);
    setPassword({ currentPassword: '', newPassword: '' });
    setMessage('Password changed');
  };

  if (!profile) {
    return <div className="text-slate-600">Loading profile...</div>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
      <section className="rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-xl shadow-slate-200/60">
        <h1 className="font-display text-4xl text-slate-950">My profile</h1>
        <p className="mt-2 text-slate-600">Manage your account details and review activity snapshots.</p>
        {message && <p className="mt-4 text-sm text-teal-700">{message}</p>}
        <form onSubmit={saveProfile} className="mt-8 space-y-4">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" />
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone" />
          <textarea rows="4" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Address" />
          <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">
            Save profile
          </button>
        </form>

        <form onSubmit={updatePassword} className="mt-10 space-y-4 rounded-3xl bg-slate-100 p-5">
          <h2 className="text-2xl font-semibold text-slate-950">Change password</h2>
          <input type="password" value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} placeholder="Current password" />
          <input type="password" value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} placeholder="New password" />
          <button type="submit" className="rounded-2xl bg-teal-600 px-4 py-3 font-semibold text-white">
            Update password
          </button>
        </form>
      </section>

      <section className="space-y-6">
        <article className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
          <h2 className="font-display text-3xl text-slate-950">Borrowing history</h2>
          <div className="mt-4 space-y-3">
            {profile.borrowingHistory.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{item.book?.title}</p>
                <p className="text-sm text-slate-600">Status: {item.status}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
          <h2 className="font-display text-3xl text-slate-950">Notifications</h2>
          <div className="mt-4 space-y-3">
            {profile.notifications.map((item) => (
              <div key={item._id} className="rounded-2xl bg-slate-100 p-4">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.message}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

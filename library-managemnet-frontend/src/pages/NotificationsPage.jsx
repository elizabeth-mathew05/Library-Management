import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (error) {
      setMessage('Unable to load notifications');
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      loadNotifications();
    } catch (error) {
      setMessage('Unable to mark notification as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setMessage('Notification deleted');
      loadNotifications();
    } catch (error) {
      setMessage('Unable to delete notification');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'overdue':
        return 'bg-rose-50 border-rose-800 text-rose-950';
      case 'reservation':
        return 'bg-teal-50 border-teal-800 text-teal-950';
      case 'payment':
        return 'bg-amber-50 border-amber-800 text-amber-950';
      case 'announcement':
        return 'bg-indigo-50 border-indigo-800 text-indigo-950';
      default:
        return 'bg-white border-slate-400 text-slate-950';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'overdue':
        return '⚠️';
      case 'reservation':
        return '📚';
      case 'payment':
        return '💳';
      case 'announcement':
        return '📢';
      default:
        return 'ℹ️';
    }
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <section className="space-y-6">
      <div className="page-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-copy mt-2">Stay updated on your library activities, overdue books, and reservations.</p>
          </div>
          {unreadCount > 0 && (
            <div className="rounded-full bg-rose-800 px-4 py-2 font-semibold text-white">
              {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      {message && (
        <p className="rounded-xl border border-slate-800 bg-slate-100 px-4 py-3 text-sm text-slate-950">
          {message}
        </p>
      )}

      <div className="page-card">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === 'all'
                ? 'bg-slate-950 text-white'
                : 'border border-slate-400 bg-white text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === 'overdue'
                ? 'bg-rose-800 text-white'
                : 'border border-slate-400 bg-white text-slate-900'
            }`}
          >
            Overdue
          </button>
          <button
            onClick={() => setFilter('reservation')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === 'reservation'
                ? 'bg-teal-800 text-white'
                : 'border border-slate-400 bg-white text-slate-900'
            }`}
          >
            Reservations
          </button>
          <button
            onClick={() => setFilter('payment')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === 'payment'
                ? 'bg-amber-800 text-white'
                : 'border border-slate-400 bg-white text-slate-900'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setFilter('announcement')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === 'announcement'
                ? 'bg-indigo-800 text-white'
                : 'border border-slate-400 bg-white text-slate-900'
            }`}
          >
            Announcements
          </button>
        </div>

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <p className="py-8 text-center text-slate-800">No notifications at the moment.</p>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`rounded-xl border-2 p-4 transition ${getTypeColor(notification.type)} ${
                  !notification.read ? '' : 'border-slate-400'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getTypeIcon(notification.type)}</span>
                      <h3 className="font-semibold">{notification.title}</h3>
                      {!notification.read && (
                        <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-bold text-white">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="mb-2 text-sm text-slate-900">{notification.message}</p>
                    <p className="text-xs text-slate-800">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification._id)}
                        className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700"
                      >
                        Delete
                      </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

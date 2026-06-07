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
        return 'bg-rose-50 border-rose-200 text-rose-900';
      case 'reservation':
        return 'bg-teal-50 border-teal-200 text-teal-900';
      case 'payment':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-900';
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
      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl text-slate-950">Notifications</h1>
            <p className="mt-2 text-slate-600">Stay updated on your library activities, overdue books, and reservations.</p>
          </div>
          {unreadCount > 0 && (
            <div className="rounded-full bg-rose-100 px-4 py-2 text-rose-700 font-semibold">
              {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      {message && (
        <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </p>
      )}

      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === 'all'
                ? 'bg-slate-950 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === 'overdue'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Overdue
          </button>
          <button
            onClick={() => setFilter('reservation')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === 'reservation'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Reservations
          </button>
          <button
            onClick={() => setFilter('payment')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === 'payment'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Payments
          </button>
        </div>

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No notifications at the moment.</p>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`rounded-xl border-2 p-4 transition ${getTypeColor(notification.type)} ${
                  !notification.read ? 'bg-opacity-100' : 'opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getTypeIcon(notification.type)}</span>
                      <h3 className="font-semibold">{notification.title}</h3>
                      {!notification.read && (
                        <span className="ml-auto text-xs font-bold bg-current bg-opacity-20 px-2 py-1 rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-90 mb-2">{notification.message}</p>
                    <p className="text-xs opacity-60">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="px-3 py-1 text-xs font-semibold bg-current bg-opacity-20 rounded-full hover:bg-opacity-30 transition"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notification._id)}
                      className="px-3 py-1 text-xs font-semibold bg-current bg-opacity-10 rounded-full hover:bg-opacity-20 transition"
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

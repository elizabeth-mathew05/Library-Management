import { useEffect, useState } from 'react';
import api from '../api/client.js';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../utils/validation.js';

const CANCELABLE_STATUSES = new Set(['pending', 'queued', 'ready']);

export default function ReservationsPage() {
  const { user } = useAuth();
  const isMember = user?.role === 'user';
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [processingId, setProcessingId] = useState(null);

  const loadReservations = async () => {
    const { data } = await api.get('/reservations');
    setReservations(data);
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const cancelReservation = async (reservationId) => {
    if (processingId) {
      return;
    }

    setProcessingId(reservationId);
    setMessage('');

    try {
      await api.patch(`/reservations/${reservationId}/cancel`);
      setMessage('Reservation cancelled');
      setMessageType('success');
      await loadReservations();
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to cancel reservation'));
      setMessageType('error');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusStyle = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'ready':
        return 'bg-teal-100 text-teal-700';
      case 'cancelled':
        return 'bg-slate-100 text-slate-600';
      case 'fulfilled':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h1 className="font-display text-4xl text-slate-950">Reservations</h1>
        <p className="mt-2 text-slate-600">See queued reservations for books that currently have no copies to borrow.</p>
      </div>

      <StatusMessage type={messageType}>{message}</StatusMessage>

      <div className="grid gap-4 md:grid-cols-2">
        {reservations.map((reservation) => {
          const normalizedStatus = (reservation.status || '').toLowerCase();
          const canCancel = isMember && CANCELABLE_STATUSES.has(normalizedStatus);
          const isProcessing = processingId === reservation._id;

          return (
            <article key={reservation._id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <h2 className="text-2xl font-semibold text-slate-950">{reservation.book?.title}</h2>
              <p className="text-sm text-slate-500">{reservation.book?.author}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-slate-600">Status:</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusStyle(normalizedStatus)}`}>
                  {reservation.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">Queue position: {reservation.queuePosition}</p>

              {canCancel ? (
                <button
                  onClick={() => cancelReservation(reservation._id)}
                  disabled={isProcessing}
                  className={`mt-5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isProcessing
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isProcessing ? 'Cancelling...' : 'Cancel reservation'}
                </button>
              ) : (
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">No actions available</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

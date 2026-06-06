import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState('');

  const loadReservations = async () => {
    const { data } = await api.get('/reservations');
    setReservations(data);
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const cancelReservation = async (reservationId) => {
    try {
      await api.patch(`/reservations/${reservationId}/cancel`);
      setMessage('Reservation cancelled');
      loadReservations();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to cancel reservation');
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <h1 className="font-display text-4xl text-slate-950">Reservations</h1>
        <p className="mt-2 text-slate-600">See queued and ready reservations for high-demand books.</p>
      </div>

      {message && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {reservations.map((reservation) => (
          <article key={reservation._id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <h2 className="text-2xl font-semibold text-slate-950">{reservation.book?.title}</h2>
            <p className="text-sm text-slate-500">{reservation.book?.author}</p>
            <p className="mt-3 text-sm text-slate-600">Status: {reservation.status}</p>
            <p className="text-sm text-slate-600">Queue position: {reservation.queuePosition}</p>
            <button onClick={() => cancelReservation(reservation._id)} className="mt-5 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Cancel reservation
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

import { useState } from 'react';
import api from '../api/client.js';
import StatusMessage from './StatusMessage.jsx';
import { getApiErrorMessage } from '../utils/validation.js';

const formatCardNumber = (value) =>
  value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export default function PaymentCheckout({ borrowId, amount, bookTitle, onClose, onSuccess }) {
  const [form, setForm] = useState({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};
    const number = form.cardNumber.replace(/\D/g, '');

    if (!form.cardholderName.trim() || form.cardholderName.trim().length < 2) {
      nextErrors.cardholderName = 'Cardholder name is required.';
    }

    if (number.length < 13) {
      nextErrors.cardNumber = 'Enter a complete card number.';
    }

    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) {
      nextErrors.expiry = 'Use MM/YY.';
    }

    if (!/^\d{3,4}$/.test(form.cvc)) {
      nextErrors.cvc = 'Enter a 3 or 4 digit CVC.';
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setMessage('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post('/payments/late-fee', { borrowId });
      const paymentId = data.payment?._id;
      await api.post(`/payments/${paymentId}/confirm`, {
        cardholderName: form.cardholderName.trim(),
        cardNumber: form.cardNumber.replace(/\D/g, ''),
        expiry: form.expiry,
        cvc: form.cvc
      });
      onSuccess?.(`Paid $${Number(amount).toFixed(2)} for ${bookTitle || 'late fee'}.`);
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Payment failed. Try the test card 4242 4242 4242 4242.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-800">Library payment gateway</p>
            <h2 className="mt-1 font-display text-2xl text-slate-950">Pay late fee</h2>
            <p className="mt-1 text-sm text-slate-700">
              {bookTitle || 'Library late fee'} · <strong>${Number(amount).toFixed(2)}</strong>
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-800">Cardholder name</span>
            <input
              value={form.cardholderName}
              onChange={(event) => setForm({ ...form, cardholderName: event.target.value })}
              placeholder="Name on card"
              autoComplete="cc-name"
            />
            {errors.cardholderName && <p className="mt-1 text-sm text-rose-700">{errors.cardholderName}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-800">Card number</span>
            <input
              value={form.cardNumber}
              onChange={(event) => setForm({ ...form, cardNumber: formatCardNumber(event.target.value) })}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="cc-number"
            />
            {errors.cardNumber && <p className="mt-1 text-sm text-rose-700">{errors.cardNumber}</p>}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">Expiry</span>
              <input
                value={form.expiry}
                onChange={(event) => setForm({ ...form, expiry: formatExpiry(event.target.value) })}
                placeholder="MM/YY"
                inputMode="numeric"
                autoComplete="cc-exp"
              />
              {errors.expiry && <p className="mt-1 text-sm text-rose-700">{errors.expiry}</p>}
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">CVC</span>
              <input
                value={form.cvc}
                onChange={(event) => setForm({ ...form, cvc: event.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
              />
              {errors.cvc && <p className="mt-1 text-sm text-rose-700">{errors.cvc}</p>}
            </label>
          </div>

          <StatusMessage type="error">{message}</StatusMessage>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:bg-slate-300 disabled:text-slate-600"
          >
            {submitting ? 'Processing...' : `Pay $${Number(amount).toFixed(2)}`}
          </button>
          <p className="text-xs text-slate-800">
            Test card: 4242 4242 4242 4242 · any future expiry · any CVC. Card details are not stored.
          </p>
        </form>
      </div>
    </div>
  );
}

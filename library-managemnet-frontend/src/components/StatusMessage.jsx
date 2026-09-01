const styles = {
  success: 'border-teal-200 bg-teal-50 text-teal-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-slate-200 bg-slate-50 text-slate-700'
};

export default function StatusMessage({ type = 'info', children }) {
  if (!children) {
    return null;
  }

  return (
    <p className={`rounded-xl border px-4 py-3 text-sm ${styles[type] || styles.info}`} role="status">
      {children}
    </p>
  );
}

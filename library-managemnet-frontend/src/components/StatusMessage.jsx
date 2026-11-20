const styles = {
  success: 'border-teal-900 bg-teal-50 text-teal-950',
  error: 'border-rose-900 bg-rose-50 text-rose-950',
  info: 'border-slate-700 bg-white text-slate-950'
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

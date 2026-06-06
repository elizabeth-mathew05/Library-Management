export default function StatCard({ title, value, helper }) {
  return (
    <article className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <h3 className="mt-3 text-4xl font-semibold text-slate-950">{value}</h3>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </article>
  );
}

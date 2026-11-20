export default function StatCard({ title, value, helper }) {
  return (
    <article className="rounded-2xl border border-slate-300 bg-white p-4 sm:p-5">
      <p className="text-sm font-bold uppercase text-slate-800">{title}</p>
      <h3 className="mt-2 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">{value}</h3>
      <p className="mt-2 text-sm text-slate-800">{helper}</p>
    </article>
  );
}

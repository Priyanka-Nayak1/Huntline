export function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-ink/50">{label}</p>
      <p className="mt-3 font-serif text-3xl">{value}</p>
      {hint ? <p className="mt-2 text-sm text-ink/55">{hint}</p> : null}
    </div>
  );
}

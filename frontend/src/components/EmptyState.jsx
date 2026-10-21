export function EmptyState({ title, body, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-ink/65">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

import { useState } from "react";

export function TagInput({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  function addValue() {
    const next = draft.trim();
    if (!next) return;
    if (!values.some((item) => item.toLowerCase() === next.toLowerCase())) {
      onChange([...values, next]);
    }
    setDraft("");
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {values.map((item) => (
          <button
            type="button"
            key={item}
            className="rounded-full border border-line bg-paper px-3 py-1 text-sm hover:border-rust"
            onClick={() => onChange(values.filter((value) => value !== item))}
          >
            {item} ×
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-forest"
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addValue();
            }
          }}
        />
        <button type="button" className="rounded-lg bg-ink px-4 py-2 text-sm text-paper" onClick={addValue}>
          Add
        </button>
      </div>
    </div>
  );
}

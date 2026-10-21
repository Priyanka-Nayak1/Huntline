import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api.js";
import { TagInput } from "../components/TagInput.jsx";

export function Preferences() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["preferences"], queryFn: api.getPreferences });
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updatePreferences({
        ...form,
        minExperienceYears: Number(form.minExperienceYears),
        maxExperienceYears: Number(form.maxExperienceYears),
        minMatchScore: Number(form.minMatchScore),
        dailyJobTarget: Number(form.dailyJobTarget),
        minSalary: form.minSalary === "" || form.minSalary == null ? null : Number(form.minSalary),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["preferences"], data);
      setMessage("Preferences saved. The daily scheduler uses these settings.");
    },
  });

  if (!form) return <p>Loading preferences…</p>;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-rust">Search criteria</p>
        <h1 className="mt-2 font-serif text-4xl">Job preferences</h1>
        <p className="mt-3 max-w-2xl text-ink/65">
          The agent uses these constraints for cheap filtering before it spends AI calls on ranking.
        </p>
      </div>

      {message ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          saveMutation.mutate();
        }}
      >
        <TagInput
          label="Preferred job titles"
          values={form.preferredTitles || []}
          onChange={(preferredTitles) => setForm({ ...form, preferredTitles })}
          placeholder="Full Stack Developer"
        />
        <TagInput
          label="Skills / keywords"
          values={form.skills || []}
          onChange={(skills) => setForm({ ...form, skills })}
          placeholder="React"
        />
        <TagInput
          label="Locations"
          values={form.locations || []}
          onChange={(locations) => setForm({ ...form, locations })}
          placeholder="Remote"
        />
        <TagInput
          label="Excluded companies"
          values={form.excludedCompanies || []}
          onChange={(excludedCompanies) => setForm({ ...form, excludedCompanies })}
          placeholder="Company name"
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <NumberField label="Min experience" value={form.minExperienceYears} onChange={(minExperienceYears) => setForm({ ...form, minExperienceYears })} />
          <NumberField label="Max experience" value={form.maxExperienceYears} onChange={(maxExperienceYears) => setForm({ ...form, maxExperienceYears })} />
          <NumberField label="Minimum match score" value={form.minMatchScore} onChange={(minMatchScore) => setForm({ ...form, minMatchScore })} />
          <NumberField label="Daily job target" value={form.dailyJobTarget} onChange={(dailyJobTarget) => setForm({ ...form, dailyJobTarget })} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3">
            <input
              type="checkbox"
              checked={Boolean(form.remotePreferred)}
              onChange={(event) => setForm({ ...form, remotePreferred: event.target.checked })}
            />
            Remote roles are preferred
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3">
            <input
              type="checkbox"
              checked={Boolean(form.dailySearchEnabled)}
              onChange={(event) => setForm({ ...form, dailySearchEnabled: event.target.checked })}
            />
            Daily search on
          </label>
        </div>

        <label className="block max-w-xs">
          <span className="mb-2 block text-sm font-medium">Daily search time</span>
          <input
            type="time"
            className="w-full rounded-lg border border-line bg-card px-3 py-2"
            value={form.dailySearchTime}
            onChange={(event) => setForm({ ...form, dailySearchTime: event.target.value })}
          />
        </label>

        <button type="submit" className="rounded-full bg-ink px-6 py-2.5 text-sm text-paper" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving…" : "Save preferences"}
        </button>
        {saveMutation.error ? <p className="text-sm text-red-700">{saveMutation.error.message}</p> : null}
      </form>
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        type="number"
        className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

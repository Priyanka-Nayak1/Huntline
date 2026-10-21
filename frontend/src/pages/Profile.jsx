import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api.js";
import { TagInput } from "../components/TagInput.jsx";

const emptyProfile = {
  name: "",
  professionalSummary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  totalExperienceYears: "",
};

export function Profile() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: api.getProfile });
  const [form, setForm] = useState(emptyProfile);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        ...emptyProfile,
        ...profileQuery.data,
        totalExperienceYears: profileQuery.data.totalExperienceYears ?? "",
        skills: profileQuery.data.skills || [],
        experience: profileQuery.data.experience || [],
        education: profileQuery.data.education || [],
        projects: profileQuery.data.projects || [],
        certifications: profileQuery.data.certifications || [],
      });
    }
  }, [profileQuery.data]);

  const uploadMutation = useMutation({
    mutationFn: api.uploadResume,
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile);
      setMessage("Resume parsed. Review the extracted profile before searching.");
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updateProfile({
        ...form,
        totalExperienceYears: form.totalExperienceYears === "" ? null : Number(form.totalExperienceYears),
      }),
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile);
      setMessage("Profile saved.");
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-rust">Phase 2</p>
        <h1 className="mt-2 font-serif text-4xl">Resume & profile</h1>
        <p className="mt-3 max-w-2xl text-ink/65">
          Upload a PDF or DOCX. The agent extracts a structured profile, then you correct anything the model got wrong.
        </p>
      </div>

      <section className="rounded-2xl border border-line bg-card p-6">
        <h2 className="font-serif text-2xl">Upload resume</h2>
        <input
          className="mt-4 block w-full text-sm"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadMutation.mutate(file);
          }}
        />
        {profileQuery.data?.resume?.originalName ? (
          <p className="mt-3 text-sm text-ink/60">Last file: {profileQuery.data.resume.originalName}</p>
        ) : null}
        {uploadMutation.isPending ? <p className="mt-3 text-sm">Parsing resume…</p> : null}
        {uploadMutation.error ? <p className="mt-3 text-sm text-red-700">{uploadMutation.error.message}</p> : null}
      </section>

      {message ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          saveMutation.mutate();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Total experience (years)">
            <input
              className={inputClass}
              type="number"
              min="0"
              max="50"
              step="0.5"
              value={form.totalExperienceYears}
              onChange={(e) => setForm({ ...form, totalExperienceYears: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Professional summary">
          <textarea
            className={`${inputClass} min-h-28`}
            value={form.professionalSummary}
            onChange={(e) => setForm({ ...form, professionalSummary: e.target.value })}
          />
        </Field>
        <TagInput label="Skills" values={form.skills} onChange={(skills) => setForm({ ...form, skills })} placeholder="Add a skill" />
        <TagInput
          label="Certifications"
          values={form.certifications}
          onChange={(certifications) => setForm({ ...form, certifications })}
          placeholder="Add a certification"
        />

        <Repeatable
          title="Experience"
          items={form.experience}
          onChange={(experience) => setForm({ ...form, experience })}
          blank={{ company: "", role: "", startDate: "", endDate: "", description: "", technologies: [] }}
          render={(item, update) => (
            <div className="grid gap-3 md:grid-cols-2">
              <input className={inputClass} placeholder="Company" value={item.company} onChange={(e) => update({ company: e.target.value })} />
              <input className={inputClass} placeholder="Role" value={item.role} onChange={(e) => update({ role: e.target.value })} />
              <input className={inputClass} placeholder="Start date" value={item.startDate || ""} onChange={(e) => update({ startDate: e.target.value })} />
              <input className={inputClass} placeholder="End date" value={item.endDate || ""} onChange={(e) => update({ endDate: e.target.value })} />
              <textarea
                className={`${inputClass} md:col-span-2`}
                placeholder="Description"
                value={item.description || ""}
                onChange={(e) => update({ description: e.target.value })}
              />
            </div>
          )}
        />

        <Repeatable
          title="Education"
          items={form.education}
          onChange={(education) => setForm({ ...form, education })}
          blank={{ degree: "", institution: "", startDate: "", endDate: "" }}
          render={(item, update) => (
            <div className="grid gap-3 md:grid-cols-2">
              <input className={inputClass} placeholder="Degree" value={item.degree} onChange={(e) => update({ degree: e.target.value })} />
              <input className={inputClass} placeholder="Institution" value={item.institution} onChange={(e) => update({ institution: e.target.value })} />
            </div>
          )}
        />

        <Repeatable
          title="Projects"
          items={form.projects}
          onChange={(projects) => setForm({ ...form, projects })}
          blank={{ name: "", description: "", technologies: [] }}
          render={(item, update) => (
            <div className="grid gap-3">
              <input className={inputClass} placeholder="Project name" value={item.name} onChange={(e) => update({ name: e.target.value })} />
              <textarea className={inputClass} placeholder="Description" value={item.description || ""} onChange={(e) => update({ description: e.target.value })} />
            </div>
          )}
        />

        <button type="submit" className="rounded-full bg-ink px-6 py-2.5 text-sm text-paper" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving…" : "Save profile"}
        </button>
        {saveMutation.error ? <p className="text-sm text-red-700">{saveMutation.error.message}</p> : null}
      </form>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-forest";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Repeatable({ title, items, onChange, blank, render }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl">{title}</h2>
        <button type="button" className="text-sm text-forest" onClick={() => onChange([...items, { ...blank }])}>
          Add
        </button>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-xl border border-line p-4">
            {render(item, (patch) => {
              const next = [...items];
              next[index] = { ...item, ...patch };
              onChange(next);
            })}
            <button type="button" className="mt-3 text-xs text-rust" onClick={() => onChange(items.filter((_, i) => i !== index))}>
              Remove
            </button>
          </div>
        ))}
        {!items.length ? <p className="text-sm text-ink/50">None yet.</p> : null}
      </div>
    </section>
  );
}

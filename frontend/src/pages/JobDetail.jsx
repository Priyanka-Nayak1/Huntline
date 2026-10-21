import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { formatPercent } from "../utils/format.js";

export function JobDetail() {
  const { id } = useParams();
  const query = useQuery({ queryKey: ["job", id], queryFn: () => api.getJob(id) });

  if (query.isLoading) return <p>Loading job…</p>;
  if (query.error) return <p className="text-red-700">{query.error.message}</p>;

  const { job, match } = query.data;
  const applyUrl = job.applicationUrl || job.url;

  return (
    <div className="space-y-8">
      <Link to="/jobs" className="text-sm text-forest underline">
        Back to jobs
      </Link>
      <div>
        <p className="text-sm text-rust">{job.company}</p>
        <h1 className="mt-1 font-serif text-4xl">{job.title}</h1>
        <p className="mt-2 text-ink/65">
          {job.location || "Location not specified"} · {job.source}
        </p>
      </div>

      {match ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Score label="Match Score" value={match.matchScore} />
          <Score label="Skill Match" value={match.skillScore} />
          <Score label="Experience Match" value={match.experienceScore} />
          <Score label="Role Match" value={match.roleScore} />
          <Score label="Location Match" value={match.locationScore} />
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="font-serif text-2xl">Matching skills</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(match?.matchingSkills || []).map((skill) => (
              <li key={skill}>✓ {skill}</li>
            ))}
            {!match?.matchingSkills?.length ? <li className="text-ink/50">None recorded</li> : null}
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="font-serif text-2xl">Missing skills</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(match?.missingSkills || []).map((skill) => (
              <li key={skill}>• {skill}</li>
            ))}
            {!match?.missingSkills?.length ? <li className="text-ink/50">None recorded</li> : null}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="font-serif text-2xl">Why this job matches</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink/80">
          {(match?.reasons || []).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>

      <a
        href={applyUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-full bg-rust px-6 py-3 text-sm font-medium text-white"
      >
        Open Application
      </a>
      <p className="text-xs text-ink/50">Opens the original posting. This app does not submit applications.</p>
    </div>
  );
}

function Score({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-ink/50">{label}</p>
      <p className="mt-2 font-serif text-3xl">{formatPercent(value)}</p>
    </div>
  );
}

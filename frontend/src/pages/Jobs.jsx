import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { formatPercent } from "../utils/format.js";
import { EmptyState } from "../components/EmptyState.jsx";

export function Jobs() {
  const query = useQuery({ queryKey: ["jobs"], queryFn: api.listJobs });

  if (query.isLoading) return <p>Loading jobs…</p>;
  if (!query.data?.length) {
    return (
      <EmptyState
        title="No ranked jobs yet"
        body="Run a search from the dashboard after uploading a resume and setting preferences."
        action={
          <Link to="/" className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper">
            Go to dashboard
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Top jobs</h1>
        <p className="mt-2 text-ink/65">From the latest completed search. Click a row for the match breakdown.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-ink/60">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Match</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Source</th>
            </tr>
          </thead>
          <tbody>
            {query.data.map((row) => (
              <tr key={row.job._id} className="border-t border-line">
                <td className="px-4 py-3">{row.rank}</td>
                <td className="px-4 py-3">{formatPercent(row.match.matchScore)}</td>
                <td className="px-4 py-3">
                  <Link className="text-forest underline" to={`/jobs/${row.job._id}`}>
                    {row.job.title}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.job.company}</td>
                <td className="px-4 py-3">{row.job.location || "—"}</td>
                <td className="px-4 py-3">{row.job.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

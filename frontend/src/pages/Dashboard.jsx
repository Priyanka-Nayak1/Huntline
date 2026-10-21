import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { formatDate, formatPercent, greeting } from "../utils/format.js";
import { StatCard } from "../components/StatCard.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { useEffect } from "react";

export function Dashboard() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: api.getProfile });
  const runQuery = useQuery({
    queryKey: ["latestRun"],
    queryFn: api.latestRun,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "running" || status === "queued" ? 2500 : false;
    },
  });
  const reportsQuery = useQuery({ queryKey: ["reports"], queryFn: api.listReports });
  const jobsQuery = useQuery({ queryKey: ["jobs"], queryFn: api.listJobs });

  const runMutation = useMutation({
    mutationFn: api.runSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["latestRun"] });
    },
  });

  useEffect(() => {
    if (runQuery.data?.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    }
  }, [runQuery.data?.status, queryClient]);

  const run = runQuery.data;
  const latestReport = reportsQuery.data?.[0];
  const name = profileQuery.data?.name || "there";
  const busy = run?.status === "running" || run?.status === "queued" || runMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-rust">Today&apos;s search</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">
            {greeting()} {name.split(" ")[0]} 👋
          </h1>
          <p className="mt-3 max-w-2xl text-ink/65">
            The agent finds and ranks roles against your resume. It never applies for you — download the report and open
            the links yourself.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || !profileQuery.data}
            onClick={() => runMutation.mutate()}
            className="rounded-full bg-rust px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Searching…" : "Run Search Now"}
          </button>
          {latestReport ? (
            <a
              className="rounded-full border border-ink px-5 py-2.5 text-sm"
              href={api.downloadUrl(latestReport._id)}
            >
              Download Today&apos;s Excel
            </a>
          ) : null}
        </div>
      </div>

      {runMutation.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{runMutation.error.message}</p>
      ) : null}

      {!profileQuery.data ? (
        <EmptyState
          title="Upload a resume to get started"
          body="The agent needs a professional profile before it can search and rank jobs."
          action={
            <Link to="/profile" className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper">
              Go to profile
            </Link>
          }
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jobs Found" value={run?.jobsDiscovered ?? 0} />
        <StatCard label="After Filtering" value={run?.jobsFiltered ?? 0} />
        <StatCard label="AI Analyzed" value={run?.jobsAnalyzed ?? 0} />
        <StatCard label="Top Matches" value={run?.jobsSelected ?? 0} hint={`Average match ${formatPercent(run?.averageMatchScore)}`} />
      </div>

      <section className="rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Latest run</h2>
          <StatusBadge status={run?.status} />
        </div>
        <p className="mt-3 text-sm text-ink/65">{run?.message || "No search has been run yet."}</p>
        {(run?.errorList || run?.errors)?.length ? (
          <ul className="mt-3 list-disc pl-5 text-sm text-ink/70">
            {(run.errorList || run.errors).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Recent reports</h2>
          <Link to="/reports" className="text-sm text-forest underline">
            View all
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-ink/60">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Jobs</th>
                <th className="px-4 py-3 font-medium">Avg Score</th>
                <th className="px-4 py-3 font-medium">Download</th>
              </tr>
            </thead>
            <tbody>
              {(reportsQuery.data || []).slice(0, 8).map((report) => (
                <tr key={report._id} className="border-t border-line">
                  <td className="px-4 py-3">{formatDate(report.reportDate)}</td>
                  <td className="px-4 py-3">{report.jobsSelected}</td>
                  <td className="px-4 py-3">{formatPercent(report.averageMatchScore)}</td>
                  <td className="px-4 py-3">
                    <a className="text-forest underline" href={api.downloadUrl(report._id)}>
                      Download
                    </a>
                  </td>
                </tr>
              ))}
              {!reportsQuery.data?.length ? (
                <tr>
                  <td className="px-4 py-8 text-ink/50" colSpan={4}>
                    No Excel reports yet. Run a search after setting preferences.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {jobsQuery.data?.length ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Top matches</h2>
            <Link to="/jobs" className="text-sm text-forest underline">
              Open list
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {jobsQuery.data.slice(0, 4).map((row) => (
              <Link
                key={row.job._id}
                to={`/jobs/${row.job._id}`}
                className="rounded-2xl border border-line bg-card p-5 hover:border-forest"
              >
                <p className="text-sm text-rust">{formatPercent(row.match.matchScore)} match</p>
                <h3 className="mt-1 font-serif text-xl">{row.job.title}</h3>
                <p className="mt-1 text-sm text-ink/65">
                  {row.job.company} · {row.job.location || "Location n/a"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

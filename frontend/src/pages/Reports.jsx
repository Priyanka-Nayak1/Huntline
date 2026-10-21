import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api.js";
import { formatDate, formatPercent } from "../utils/format.js";
import { EmptyState } from "../components/EmptyState.jsx";

export function Reports() {
  const query = useQuery({ queryKey: ["reports"], queryFn: api.listReports });

  if (query.isLoading) return <p>Loading reports…</p>;
  if (!query.data?.length) {
    return <EmptyState title="No reports yet" body="Each completed search writes an Excel file you can download here." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl">Daily reports</h1>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-ink/60">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Jobs</th>
              <th className="px-4 py-3">Avg Score</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Download</th>
            </tr>
          </thead>
          <tbody>
            {query.data.map((report) => (
              <tr key={report._id} className="border-t border-line">
                <td className="px-4 py-3">{formatDate(report.reportDate)}</td>
                <td className="px-4 py-3">{report.jobsSelected}</td>
                <td className="px-4 py-3">{formatPercent(report.averageMatchScore)}</td>
                <td className="px-4 py-3">{report.fileName}</td>
                <td className="px-4 py-3">
                  <a className="text-forest underline" href={api.downloadUrl(report._id)}>
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

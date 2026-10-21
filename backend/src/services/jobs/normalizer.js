import { jobFingerprint } from "../../utils/fingerprint.js";
import { normalizeWhitespace } from "../../utils/normalize.js";

export function normalizeJob(raw) {
  const title = normalizeWhitespace(raw.title);
  const company = normalizeWhitespace(raw.company);
  const url = String(raw.url || raw.applicationUrl || "").trim();
  if (!title || !company || !url) return null;

  const job = {
    title,
    company,
    location: normalizeWhitespace(raw.location || ""),
    description: normalizeWhitespace(raw.description || ""),
    url,
    applicationUrl: String(raw.applicationUrl || url).trim(),
    source: raw.source,
    sourceJobId: raw.sourceJobId ? String(raw.sourceJobId) : "",
    employmentType: normalizeWhitespace(raw.employmentType || ""),
    postedAt: raw.postedAt ? new Date(raw.postedAt) : null,
    discoveredAt: new Date(),
    salaryText: raw.salaryText || "",
    salaryMin: raw.salaryMin ?? null,
  };
  job.fingerprint = jobFingerprint(job);
  return job;
}

import { normalizeCompany, normalizeLocation, normalizeTitle, normalizeUrl } from "../../utils/normalize.js";

export function deduplicateJobs(jobs) {
  const byFingerprint = new Map();
  const byUrl = new Map();
  const byCtl = new Map();
  const unique = [];
  const duplicates = [];

  for (const job of jobs) {
    const urlKey = normalizeUrl(job.applicationUrl || job.url);
    const ctlKey = `${normalizeCompany(job.company)}|${normalizeTitle(job.title)}|${normalizeLocation(job.location || "")}`;

    if (byFingerprint.has(job.fingerprint) || (urlKey && byUrl.has(urlKey)) || byCtl.has(ctlKey)) {
      duplicates.push(job);
      continue;
    }

    byFingerprint.set(job.fingerprint, job);
    if (urlKey) byUrl.set(urlKey, job);
    byCtl.set(ctlKey, job);
    unique.push(job);
  }

  return { unique, duplicates };
}

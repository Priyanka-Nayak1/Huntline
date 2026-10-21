import { Job } from "../../models/job.model.js";
import { DailyReport } from "../../models/daily-report.model.js";
import { normalizeJob } from "./normalizer.js";
import { deduplicateJobs } from "./deduplicator.js";

export async function persistJobs(rawJobs) {
  const normalized = rawJobs.map(normalizeJob).filter(Boolean);
  const { unique, duplicates } = deduplicateJobs(normalized);
  const saved = [];

  for (const job of unique) {
    const doc = await Job.findOneAndUpdate(
      { fingerprint: job.fingerprint },
      { $set: { ...job, discoveredAt: new Date() } },
      { upsert: true, returnDocument: "after" }
    );
    saved.push(doc);
  }

  return { saved, duplicateCount: duplicates.length };
}

export async function recentlyReportedFingerprints(days = 14) {
  const since = new Date(Date.now() - days * 86400000);
  const reports = await DailyReport.find({ createdAt: { $gte: since } }).populate("topJobIds");
  const fingerprints = new Set();
  for (const report of reports) {
    for (const job of report.topJobIds || []) {
      if (job?.fingerprint) fingerprints.add(job.fingerprint);
    }
  }
  return fingerprints;
}

export async function getJobById(id) {
  return Job.findById(id);
}

export async function listJobs({ limit = 50 } = {}) {
  return Job.find().sort({ discoveredAt: -1 }).limit(limit);
}

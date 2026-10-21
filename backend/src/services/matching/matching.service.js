import { env } from "../../config/env.js";
import { JobMatch } from "../../models/job-match.model.js";
import { getAIProvider } from "../ai/index.js";
import { calculateFinalScore } from "./scorer.js";
import { logger } from "../../config/logger.js";

export async function analyzeJobs({ jobs, profile, preferences, profileHash, searchRunId, maxCalls }) {
  const provider = getAIProvider();
  const knownSkills = [...(profile.skills || []), ...(preferences.skills || [])];
  const analyzed = [];
  const failed = [];
  let aiCalls = 0;
  const cutoff = new Date(Date.now() - env.MATCH_CACHE_DAYS * 86400000);

  for (const job of jobs) {
    if (aiCalls >= maxCalls) break;

    const cached = await JobMatch.findOne({
      jobFingerprint: job.fingerprint,
      profileHash,
      analyzedAt: { $gte: cutoff },
    });

    if (cached) {
      analyzed.push({ job, match: cached.toObject(), cached: true });
      continue;
    }

    try {
      aiCalls += 1;
      const signals = await provider.analyzeJob(profile, preferences, job);
      const scored = calculateFinalScore({ ...signals, knownSkills });
      const saved = await JobMatch.findOneAndUpdate(
        { jobFingerprint: job.fingerprint, profileHash },
        {
          jobId: job._id,
          searchRunId,
          ...scored,
          analyzedAt: new Date(),
          profileHash,
          jobFingerprint: job.fingerprint,
          provider: provider.name,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      analyzed.push({ job, match: saved.toObject(), cached: false });
    } catch (error) {
      logger.warn({ err: error.message, title: job.title }, "Job analysis failed");
      failed.push({ job, reason: error.message });
    }
  }

  return { analyzed, failed, aiCalls };
}

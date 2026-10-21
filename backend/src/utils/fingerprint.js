import crypto from "node:crypto";
import { normalizeCompany, normalizeLocation, normalizeTitle, normalizeUrl } from "./normalize.js";

export function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function jobFingerprint(job) {
  if (job.source && job.sourceJobId) {
    return sha256(`source:${job.source}:${job.sourceJobId}`);
  }
  const url = normalizeUrl(job.applicationUrl || job.url);
  if (url) return sha256(`url:${url}`);
  return sha256(
    `ctl:${normalizeCompany(job.company)}|${normalizeTitle(job.title)}|${normalizeLocation(job.location || "")}`
  );
}

export function profileHash(profile, preferences) {
  return sha256(
    JSON.stringify({
      skills: profile?.skills || [],
      titles: preferences?.preferredTitles || [],
      locations: preferences?.locations || [],
      experience: [preferences?.minExperienceYears, preferences?.maxExperienceYears],
      summary: profile?.professionalSummary || "",
      years: profile?.totalExperienceYears,
    })
  );
}

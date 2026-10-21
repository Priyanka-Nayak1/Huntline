import { EXCLUDED_REASONS } from "../../config/constants.js";
import { looksRemote, normalizeCompany, normalizeLocation, normalizeTitle } from "../../utils/normalize.js";

const MAX_AGE_DAYS = 60;

export function filterJobs(jobs, preferences, seenFingerprints = new Set()) {
  const kept = [];
  const excluded = [];

  for (const job of jobs) {
    const reason = exclusionReason(job, preferences, seenFingerprints);
    if (reason) {
      excluded.push({ job, reason });
    } else {
      kept.push(job);
    }
  }

  return { kept, excluded };
}

function exclusionReason(job, preferences, seenFingerprints) {
  if (seenFingerprints.has(job.fingerprint)) return EXCLUDED_REASONS.ALREADY_REPORTED;
  if (!job.description || job.description.length < 40) return EXCLUDED_REASONS.MISSING_DESCRIPTION;

  if (job.postedAt) {
    const ageDays = (Date.now() - new Date(job.postedAt).getTime()) / 86400000;
    if (ageDays > MAX_AGE_DAYS) return EXCLUDED_REASONS.EXPIRED;
  }

  const excludedCompanies = (preferences.excludedCompanies || []).map(normalizeCompany);
  if (excludedCompanies.includes(normalizeCompany(job.company))) {
    return EXCLUDED_REASONS.EXCLUDED_COMPANY;
  }

  if (preferences.minSalary && job.salaryMin && job.salaryMin < preferences.minSalary) {
    return EXCLUDED_REASONS.SALARY;
  }

  const blob = `${job.title} ${job.location || ""} ${job.description}`;
  const locations = preferences.locations || [];
  if (locations.length) {
    const remoteOk = preferences.remotePreferred && looksRemote(blob);
    const locationOk = locations.some((loc) => normalizeLocation(blob).includes(normalizeLocation(loc)));
    if (!remoteOk && !locationOk) return EXCLUDED_REASONS.LOCATION;
  }

  const titles = preferences.preferredTitles || [];
  if (titles.length) {
    const jobTitle = normalizeTitle(job.title);
    const titleOk = titles.some((title) => {
      const preferred = normalizeTitle(title);
      return (
        jobTitle.includes(preferred) ||
        preferred.includes(jobTitle) ||
        preferred.split(" ").filter((word) => word.length > 2 && jobTitle.includes(word)).length >= 1
      );
    });
    if (!titleOk) return EXCLUDED_REASONS.TITLE;
  }

  if ((preferences.employmentTypes || []).length && job.employmentType) {
    const wanted = preferences.employmentTypes.map((item) => item.toLowerCase());
    if (!wanted.some((type) => job.employmentType.toLowerCase().includes(type))) {
      return EXCLUDED_REASONS.EMPLOYMENT;
    }
  }

  return null;
}

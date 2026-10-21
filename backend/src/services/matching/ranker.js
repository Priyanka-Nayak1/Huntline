import { EXCLUDED_REASONS } from "../../config/constants.js";

export function rankAndSelect(analyzed, { target = 20, minScore = 80 } = {}) {
  const sorted = [...analyzed].sort((a, b) => {
    if (b.match.matchScore !== a.match.matchScore) return b.match.matchScore - a.match.matchScore;
    const aFresh = a.job.postedAt ? new Date(a.job.postedAt).getTime() : 0;
    const bFresh = b.job.postedAt ? new Date(b.job.postedAt).getTime() : 0;
    return bFresh - aFresh;
  });

  const selected = [];
  const excluded = [];
  const companyCounts = new Map();
  const maxPerCompany = 2;

  for (const item of sorted) {
    if (item.match.matchScore < minScore) {
      excluded.push({ job: item.job, match: item.match, reason: EXCLUDED_REASONS.BELOW_THRESHOLD });
      continue;
    }
    const key = item.job.company.trim().toLowerCase();
    const count = companyCounts.get(key) || 0;
    if (count >= maxPerCompany && selected.length < target) {
      excluded.push({ job: item.job, match: item.match, reason: EXCLUDED_REASONS.COMPANY_CAP });
      continue;
    }
    if (selected.length >= target) {
      excluded.push({ job: item.job, match: item.match, reason: EXCLUDED_REASONS.COMPANY_CAP });
      continue;
    }
    companyCounts.set(key, count + 1);
    selected.push(item);
  }

  return { selected, excluded };
}

export const SCORE_WEIGHTS = {
  skill: 0.4,
  experience: 0.25,
  role: 0.2,
  location: 0.1,
  other: 0.05,
};

export const AGENT_LIMITS = {
  maxQueries: 12,
  maxJobsDiscovered: 300,
  maxJobsToAnalyze: 80,
  maxAiCalls: 80,
  maxExecutionMs: 8 * 60 * 1000,
  maxSourceFailures: 20,
  sourceTimeoutMs: 20_000,
  greenhouseBoardLimit: 12,
  leverSiteLimit: 10,
};

export const JOB_TARGET_DEFAULT = 20;
export const MIN_MATCH_DEFAULT = 80;
export const UPLOAD_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const EXCLUDED_REASONS = {
  DUPLICATE: "Duplicate of another discovered job",
  LOCATION: "Location did not match preferences",
  EXPERIENCE: "Experience range did not match",
  TITLE: "Job title did not match preferred roles",
  EMPLOYMENT: "Employment type did not match preferences",
  REMOTE: "Remote preference not satisfied",
  ALREADY_REPORTED: "Already included in a recent report",
  EXPIRED: "Job appears expired or too old",
  EXCLUDED_COMPANY: "Company is on the exclusion list",
  SALARY: "Salary below the configured minimum",
  MISSING_DESCRIPTION: "Job description was missing or too short",
  BELOW_THRESHOLD: "Match score below the minimum threshold",
  COMPANY_CAP: "Diversity cap: another role from this company ranked higher",
  AI_FAILED: "Could not analyze this job",
};

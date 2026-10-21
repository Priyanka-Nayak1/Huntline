import { uniqueStrings } from "../../utils/sanitize.js";
import { looksRemote, normalizeLocation, normalizeTitle } from "../../utils/normalize.js";
import { parseResumeProfile } from "../resume/structured-parser.js";
import { jobMatchResultSchema, queryResultSchema, resumeProfileSchema } from "./schemas.js";

const SKILL_DICTIONARY = [
  "React",
  "Next.js",
  "Node.js",
  "TypeScript",
  "JavaScript",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "GraphQL",
  "REST",
  "Redux",
  "HTML",
  "CSS",
  "Tailwind",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "Python",
  "Django",
  "Flask",
  "Java",
  "Spring",
  "C#",
  ".NET",
  "Go",
  "Rust",
  "PHP",
  "Laravel",
  "Ruby",
  "Rails",
  "Redis",
  "Kafka",
  "RabbitMQ",
  "Git",
  "CI/CD",
  "Jest",
  "Cypress",
  "Playwright",
  "MERN",
  "SQL",
  "NoSQL",
  "Linux",
  "Microservices",
  "Sass",
  "Webpack",
  "Vite",
];

/**
 * Deterministic fallback so the agent still runs when no LLM key is configured.
 * It never invents jobs and only scores from text overlap.
 */
export class HeuristicProvider {
  name = "heuristic";

  isConfigured() {
    return true;
  }

  async extractResumeProfile(text) {
    return resumeProfileSchema.parse(parseResumeProfile(text));
  }

  async generateSearchQueries(profile, preferences) {
    const titles = uniqueStrings([...(preferences.preferredTitles || []), ...(profile.experience || []).map((item) => item.role)]).slice(0, 4);
    const skills = uniqueStrings([...(preferences.skills || []), ...(profile.skills || [])]).slice(0, 6);
    const locations = uniqueStrings(preferences.locations || ["Remote"]).slice(0, 3);
    const queries = [];
    for (const title of titles.length ? titles : ["Software Engineer"]) {
      for (const location of locations) {
        const skillPart = skills.slice(0, 2).join(" ");
        queries.push(`${title} ${skillPart} ${location}`.replace(/\s+/g, " ").trim());
      }
    }
    if (preferences.remotePreferred) {
      queries.push(`${titles[0] || "Software Engineer"} ${skills[0] || ""} Remote`.trim());
    }
    return queryResultSchema.parse({ queries: uniqueStrings(queries).slice(0, 10) }).queries;
  }

  async analyzeJob(profile, preferences, job) {
    const haystack = `${job.title} ${job.company} ${job.location || ""} ${job.description || ""}`.toLowerCase();
    const candidateSkills = uniqueStrings([...(profile.skills || []), ...(preferences.skills || [])]);
    const matchingSkills = candidateSkills.filter((skill) => haystack.includes(skill.toLowerCase()));
    const missingSkills = uniqueStrings(preferences.skills || []).filter(
      (skill) => !haystack.includes(skill.toLowerCase()) && !matchingSkills.some((m) => m.toLowerCase() === skill.toLowerCase())
    );
    const skillMatchScore = candidateSkills.length
      ? Math.round((matchingSkills.length / Math.max(candidateSkills.length, 1)) * 100)
      : 40;
    const roleMatchScore = scoreRole(job.title, preferences.preferredTitles || []);
    const locationMatchScore = scoreLocation(job, preferences);
    const experienceMatchScore = scoreExperience(job.description, profile.totalExperienceYears, preferences);
    const otherScore = job.postedAt && Date.now() - new Date(job.postedAt).getTime() < 14 * 86400000 ? 80 : 50;
    const reasons = [];
    if (matchingSkills.length) reasons.push(`Overlapping skills: ${matchingSkills.slice(0, 6).join(", ")}`);
    if (roleMatchScore >= 70) reasons.push("Job title aligns with preferred roles");
    if (locationMatchScore >= 70) reasons.push("Location or remote preference is supported");
    const parsed = jobMatchResultSchema.parse({
      skillMatchScore,
      experienceMatchScore,
      locationMatchScore,
      roleMatchScore,
      otherScore,
      matchingSkills,
      missingSkills: missingSkills.slice(0, 8),
      reasons: reasons.length ? reasons : ["Limited overlap with the stored profile"],
      recommendation: skillMatchScore >= 70 && roleMatchScore >= 60 ? "APPLY" : "REVIEW",
    });
    return parsed;
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreRole(title, preferredTitles) {
  if (!preferredTitles.length) return 60;
  const normalized = normalizeTitle(title);
  let best = 0;
  for (const preferred of preferredTitles) {
    const p = normalizeTitle(preferred);
    if (!p) continue;
    if (normalized === p) best = Math.max(best, 100);
    else if (normalized.includes(p) || p.includes(normalized)) best = Math.max(best, 88);
    else {
      const overlap = p.split(" ").filter((word) => word.length > 2 && normalized.includes(word)).length;
      best = Math.max(best, Math.min(80, overlap * 28));
    }
  }
  return best;
}

function scoreLocation(job, preferences) {
  const locations = preferences.locations || [];
  const blob = `${job.location || ""} ${job.description || ""}`;
  if (preferences.remotePreferred && looksRemote(blob)) return 100;
  if (!locations.length) return 70;
  const normalizedJob = normalizeLocation(blob);
  if (locations.some((loc) => normalizedJob.includes(normalizeLocation(loc)))) return 95;
  return 25;
}

function scoreExperience(description, years, preferences) {
  if (years == null) return 60;
  if (years >= (preferences.minExperienceYears || 0) && years <= (preferences.maxExperienceYears || 40)) {
    return 90;
  }
  const required = (description || "").match(/(\d+)\s*\+?\s*(?:years|yrs)/i);
  if (!required) return 65;
  const need = Number(required[1]);
  if (years >= need) return 85;
  if (need - years <= 1) return 60;
  return 30;
}

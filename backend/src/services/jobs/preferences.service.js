import { z } from "zod";
import { JobPreference } from "../../models/job-preference.model.js";
import { uniqueStrings, clampNumber } from "../../utils/sanitize.js";
import { JOB_TARGET_DEFAULT, MIN_MATCH_DEFAULT } from "../../config/constants.js";

const preferencesSchema = z.object({
  preferredTitles: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  minExperienceYears: z.number().min(0).max(40).default(0),
  maxExperienceYears: z.number().min(0).max(50).default(10),
  minMatchScore: z.number().min(0).max(100).default(MIN_MATCH_DEFAULT),
  dailyJobTarget: z.number().min(1).max(50).default(JOB_TARGET_DEFAULT),
  employmentTypes: z.array(z.string()).default([]),
  remotePreferred: z.boolean().default(true),
  excludedCompanies: z.array(z.string()).default([]),
  minSalary: z.number().nullable().optional(),
  dailySearchEnabled: z.boolean().default(false),
  dailySearchTime: z.string().regex(/^\d{2}:\d{2}$/).default("08:00"),
});

const defaults = {
  preferredTitles: ["Full Stack Developer", "Software Engineer", "React Developer", "Node.js Developer"],
  skills: ["React", "Next.js", "Node.js", "TypeScript"],
  locations: ["India", "Remote", "Gurgaon", "Noida"],
  minExperienceYears: 2,
  maxExperienceYears: 5,
  minMatchScore: MIN_MATCH_DEFAULT,
  dailyJobTarget: JOB_TARGET_DEFAULT,
  employmentTypes: [],
  remotePreferred: true,
  excludedCompanies: [],
  minSalary: null,
  dailySearchEnabled: false,
  dailySearchTime: "08:00",
};

export async function getPreferences() {
  const existing = await JobPreference.findOne();
  if (existing) return existing;
  return JobPreference.create(defaults);
}

export async function updatePreferences(payload) {
  const parsed = preferencesSchema.parse({
    preferredTitles: payload.preferredTitles,
    skills: payload.skills,
    locations: payload.locations,
    minExperienceYears: Number(payload.minExperienceYears),
    maxExperienceYears: Number(payload.maxExperienceYears),
    minMatchScore: Number(payload.minMatchScore),
    dailyJobTarget: Number(payload.dailyJobTarget),
    employmentTypes: payload.employmentTypes || [],
    remotePreferred: Boolean(payload.remotePreferred),
    excludedCompanies: payload.excludedCompanies || [],
    minSalary: payload.minSalary === "" || payload.minSalary == null ? null : Number(payload.minSalary),
    dailySearchEnabled: Boolean(payload.dailySearchEnabled),
    dailySearchTime: payload.dailySearchTime || "08:00",
  });
  parsed.preferredTitles = uniqueStrings(parsed.preferredTitles);
  parsed.skills = uniqueStrings(parsed.skills);
  parsed.locations = uniqueStrings(parsed.locations);
  parsed.excludedCompanies = uniqueStrings(parsed.excludedCompanies);
  parsed.employmentTypes = uniqueStrings(parsed.employmentTypes);
  parsed.minExperienceYears = clampNumber(parsed.minExperienceYears, 0, 40, 0);
  parsed.maxExperienceYears = Math.max(parsed.minExperienceYears, parsed.maxExperienceYears);
  const existing = await getPreferences();
  existing.set(parsed);
  await existing.save();
  return existing;
}

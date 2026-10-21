import { z } from "zod";
import { resumeProfileSchema } from "../ai/schemas.js";
import { asStringArray, uniqueStrings } from "../../utils/sanitize.js";

const editableProfileSchema = resumeProfileSchema.extend({
  name: z.string().min(1).max(120),
});

export function validateAndNormalizeProfile(input) {
  const parsed = editableProfileSchema.parse(coerceProfile(input));
  return finalizeProfile(parsed);
}

export function profileFromAi(raw) {
  const parsed = resumeProfileSchema.parse(coerceProfile(raw));
  return finalizeProfile(parsed);
}

export function mergeProfiles(structured, ai) {
  const base = finalizeProfile(resumeProfileSchema.parse(coerceProfile(structured)));
  const overlay = finalizeProfile(resumeProfileSchema.parse(coerceProfile(ai || {})));
  return finalizeProfile({
    name: overlay.name || base.name,
    professionalSummary: pickRicher(overlay.professionalSummary, base.professionalSummary),
    skills: uniqueStrings([...(overlay.skills || []), ...(base.skills || [])]),
    experience: overlay.experience?.length ? overlay.experience : base.experience,
    education: overlay.education?.length ? overlay.education : base.education,
    projects: overlay.projects?.length ? overlay.projects : base.projects,
    certifications: uniqueStrings([...(overlay.certifications || []), ...(base.certifications || [])]),
    totalExperienceYears: overlay.totalExperienceYears ?? base.totalExperienceYears,
  });
}

export function coerceProfile(input) {
  const source = unwrapProfile(input);
  const total = source.totalExperienceYears;
  return {
    name: String(source.name || "").trim(),
    professionalSummary: String(source.professionalSummary || source.summary || "").trim(),
    skills: asStringArray(source.skills),
    experience: Array.isArray(source.experience) ? source.experience.map(coerceExperience).filter(Boolean) : [],
    education: Array.isArray(source.education) ? source.education.map(coerceEducation).filter(Boolean) : [],
    projects: Array.isArray(source.projects) ? source.projects.map(coerceProject).filter(Boolean) : [],
    certifications: asStringArray(source.certifications),
    totalExperienceYears:
      total === "" || total == null || Number.isNaN(Number(total)) ? null : Number(total),
  };
}

function finalizeProfile(parsed) {
  parsed.skills = uniqueStrings(parsed.skills).slice(0, 80);
  parsed.certifications = uniqueStrings(parsed.certifications).slice(0, 40);
  parsed.name = parsed.name?.trim() || "";
  parsed.experience = (parsed.experience || [])
    .filter((item) => item.company || item.role)
    .slice(0, 20)
    .map((item) => ({
      ...item,
      technologies: uniqueStrings(item.technologies).slice(0, 30),
    }));
  parsed.education = (parsed.education || [])
    .filter((item) => item.degree || item.institution)
    .slice(0, 10);
  parsed.projects = (parsed.projects || [])
    .filter((item) => item.name)
    .slice(0, 15)
    .map((item) => ({
      ...item,
      technologies: uniqueStrings(item.technologies).slice(0, 30),
    }));
  if (parsed.totalExperienceYears != null) {
    parsed.totalExperienceYears = Math.min(50, Math.max(0, Number(parsed.totalExperienceYears)));
  }
  return parsed;
}

function unwrapProfile(input) {
  if (!input || typeof input !== "object") return {};
  if (input.profile && typeof input.profile === "object") return input.profile;
  if (input.data && typeof input.data === "object" && (input.data.skills || input.data.name)) return input.data;
  return input;
}

function coerceExperience(item) {
  if (!item || typeof item !== "object") return null;
  return {
    company: String(item.company || item.organization || "").trim(),
    role: String(item.role || item.title || item.position || "").trim(),
    startDate: String(item.startDate || item.start || "").trim(),
    endDate: String(item.endDate || item.end || "").trim(),
    description: String(item.description || (Array.isArray(item.highlights) ? item.highlights.join(" ") : "")).trim(),
    technologies: asStringArray(item.technologies || item.tech || item.skills),
  };
}

function coerceEducation(item) {
  if (!item || typeof item !== "object") return null;
  return {
    degree: String(item.degree || item.course || "").trim(),
    institution: String(item.institution || item.school || item.college || "").trim(),
    startDate: String(item.startDate || "").trim(),
    endDate: String(item.endDate || item.year || "").trim(),
  };
}

function coerceProject(item) {
  if (!item || typeof item !== "object") return null;
  return {
    name: String(item.name || item.title || "").trim(),
    description: String(item.description || "").trim(),
    technologies: asStringArray(item.technologies || item.tech || item.stack),
  };
}

function pickRicher(primary, fallback) {
  if (!primary) return fallback || "";
  if (!fallback) return primary;
  if (primary.length < 40 && fallback.length > primary.length) return fallback;
  return primary;
}

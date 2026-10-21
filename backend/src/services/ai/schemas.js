import { z } from "zod";

export const resumeProfileSchema = z.object({
  name: z.string().default(""),
  professionalSummary: z.string().optional().default(""),
  skills: z.array(z.string()).default([]),
  experience: z
    .array(
      z.object({
        company: z.string().default(""),
        role: z.string().default(""),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
        technologies: z.array(z.string()).optional().default([]),
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        degree: z.string().default(""),
        institution: z.string().default(""),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string().default(""),
        description: z.string().optional(),
        technologies: z.array(z.string()).optional().default([]),
      })
    )
    .default([]),
  certifications: z.array(z.string()).optional().default([]),
  totalExperienceYears: z.number().nullable().optional(),
});

export const jobMatchResultSchema = z.object({
  matchScore: z.number().min(0).max(100).optional(),
  skillMatchScore: z.number().min(0).max(100),
  experienceMatchScore: z.number().min(0).max(100),
  locationMatchScore: z.number().min(0).max(100),
  roleMatchScore: z.number().min(0).max(100),
  otherScore: z.number().min(0).max(100).optional().default(50),
  matchingSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  reasons: z.array(z.string()).default([]),
  recommendation: z.enum(["APPLY", "REVIEW", "SKIP"]).default("REVIEW"),
});

export const queryResultSchema = z.object({
  queries: z.array(z.string().min(2)).min(1),
});

export function extractJson(text) {
  if (!text) throw new Error("Empty AI response");
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("AI response was not valid JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { extractJson, jobMatchResultSchema, queryResultSchema, resumeProfileSchema } from "./schemas.js";

/**
 * Google Gemini generateContent provider.
 * Uses GEMINI_API_KEY from the backend env only — never sent to the frontend.
 */
export class GeminiProvider {
  name = "gemini";

  constructor() {
    this.apiKey = env.GEMINI_API_KEY;
    this.baseUrl = env.GEMINI_BASE_URL.replace(/\/$/, "");
    this.model = env.GEMINI_MODEL.replace(/^models\//, "");
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async extractResumeProfile(text) {
    const data = await this.complete({
      system: `You extract a professional profile from resume text.
Return JSON only with this exact shape:
{
  "name": "string",
  "professionalSummary": "2-3 sentence summary from the resume",
  "skills": ["skill"],
  "experience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "description": "", "technologies": [] }],
  "education": [{ "degree": "", "institution": "", "startDate": "", "endDate": "" }],
  "projects": [{ "name": "", "description": "", "technologies": [] }],
  "certifications": [],
  "totalExperienceYears": 0
}
Rules:
- Never invent employers, degrees, skills, dates, or years that are not clearly present.
- Keep every job, school, and project listed in the resume.
- Split role and company even if they appear on one line like "Role - Company Dates".
- Skills include languages, frameworks, databases, and tools from a Technical Skills section.
- If a field is unknown, use an empty string, empty array, or null.`,
      user: `Resume text:\n${text.slice(0, 24000)}`,
    });
    return resumeProfileSchema.parse(data);
  }

  async generateSearchQueries(profile, preferences) {
    const data = await this.complete({
      system: `You generate diverse job-search queries for public job APIs.
Return JSON: { "queries": string[] } with 6 to 10 unique queries.
Vary titles, skills, synonyms, locations, and remote wording.
Do not include site names that require login.`,
      user: JSON.stringify({
        name: profile.name,
        skills: profile.skills,
        titles: preferences.preferredTitles,
        keywords: preferences.skills,
        locations: preferences.locations,
        experienceYears: profile.totalExperienceYears,
        remotePreferred: preferences.remotePreferred,
      }),
    });
    return queryResultSchema.parse(data).queries;
  }

  async analyzeJob(profile, preferences, job) {
    const data = await this.complete({
      system: `You compare a job description to a candidate profile.
Return JSON only.
Never claim the candidate has a skill or experience that is not in the profile.
matchingSkills must be a subset of the candidate's listed skills or preference keywords that also appear in the job.
missingSkills are job-required skills absent from the profile.
Scores are 0-100 integers.`,
      user: JSON.stringify({
        profile: {
          name: profile.name,
          summary: profile.professionalSummary,
          skills: profile.skills,
          totalExperienceYears: profile.totalExperienceYears,
          recentExperience: (profile.experience || []).slice(0, 4),
        },
        preferences: {
          preferredTitles: preferences.preferredTitles,
          skills: preferences.skills,
          locations: preferences.locations,
          minExperienceYears: preferences.minExperienceYears,
          maxExperienceYears: preferences.maxExperienceYears,
          remotePreferred: preferences.remotePreferred,
        },
        job: {
          title: job.title,
          company: job.company,
          location: job.location,
          employmentType: job.employmentType,
          description: (job.description || "").slice(0, 8000),
        },
      }),
    });
    return jobMatchResultSchema.parse(data);
  }

  async complete({ system, user }) {
    const models = uniqueModels([this.model, "gemini-3.6-flash", "gemini-2.5-flash"]);
    let lastError;

    for (const model of models) {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          return await this.completeOnce({ system, user, model });
        } catch (error) {
          lastError = error;
          const retryable = isRetryableGeminiError(error);
          logger.warn({ model, attempt, err: error.message, retryable }, "Gemini attempt failed");
          if (!retryable || attempt === 3) break;
          await sleep(400 * attempt);
        }
      }
    }

    throw lastError || new Error("Gemini request failed");
  }

  async completeOnce({ system, user, model }) {
    const url = `${this.baseUrl}/models/${model}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.warn({ status: response.status, model, body: body.slice(0, 500) }, "Gemini request failed");
      const error = new Error(`Gemini API error (${response.status})`);
      error.status = response.status;
      throw error;
    }

    const payload = await response.json();
    const content = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n");
    if (!content) {
      const reason = payload.candidates?.[0]?.finishReason || payload.promptFeedback?.blockReason || "empty response";
      throw new Error(`Gemini returned no content (${reason})`);
    }
    return extractJson(content);
  }
}

function uniqueModels(models) {
  return [...new Set(models.filter(Boolean).map((model) => String(model).replace(/^models\//, "")))];
}

function isRetryableGeminiError(error) {
  const status = error.status;
  return status === 429 || status === 500 || status === 503 || status === 504;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

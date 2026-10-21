import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UserProfile } from "../../models/user-profile.model.js";
import { getAIProvider } from "../ai/index.js";
import { sha256 } from "../../utils/fingerprint.js";
import { AppError } from "../../middleware/error-handler.js";
import { logger } from "../../config/logger.js";
import { extractResumeText } from "./text-extractor.js";
import { parseResumeProfile } from "./structured-parser.js";
import { mergeProfiles, profileFromAi, validateAndNormalizeProfile } from "./profile-validator.js";

const resumesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../storage/resumes");

export async function getProfile() {
  return UserProfile.findOne().sort({ updatedAt: -1 });
}

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) throw new AppError(400, "Upload a resume before running a job search");
  return profile;
}

export async function updateProfile(payload) {
  const normalized = validateAndNormalizeProfile(payload);
  const existing = await getProfile();
  if (!existing) {
    return UserProfile.create(normalized);
  }
  existing.set(normalized);
  await existing.save();
  return existing;
}

export async function ingestResume(file) {
  await fs.mkdir(resumesDir, { recursive: true });
  const text = await extractResumeText(file);
  const structured = parseResumeProfile(text);
  let extracted = structured;

  try {
    const provider = getAIProvider();
    const aiProfile = profileFromAi(await provider.extractResumeProfile(text));
    extracted = mergeProfiles(structured, aiProfile);
    logger.info({ provider: provider.name, name: extracted.name }, "Resume profile extracted");
  } catch (error) {
    logger.warn({ err: error.message }, "AI resume extraction failed; using structured parser");
    extracted = structured;
  }

  const storedName = `${Date.now()}-${file.originalname.replace(/[^\w.\-]+/g, "_")}`;
  const storedPath = path.join(resumesDir, storedName);
  await fs.writeFile(storedPath, file.buffer);

  const resumeMeta = {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    storedPath,
    uploadedAt: new Date(),
  };

  const existing = await getProfile();
  const next = {
    ...extracted,
    resume: resumeMeta,
    contentHash: sha256(text),
  };

  if (existing) {
    existing.set(next);
    await existing.save();
    return existing;
  }
  return UserProfile.create(next);
}

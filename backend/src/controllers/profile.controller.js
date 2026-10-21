import { asyncHandler } from "../utils/async-handler.js";
import { ok } from "../utils/api-response.js";
import { AppError } from "../middleware/error-handler.js";
import { getProfile, ingestResume, updateProfile } from "../services/resume/resume.service.js";

export const getProfileHandler = asyncHandler(async (_req, res) => {
  const profile = await getProfile();
  return ok(res, profile);
});

export const updateProfileHandler = asyncHandler(async (req, res) => {
  const profile = await updateProfile(req.body);
  return ok(res, profile, "Profile updated");
});

export const uploadResumeHandler = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, "Resume file is required");
  const profile = await ingestResume(req.file);
  return ok(res, profile, "Resume parsed and profile extracted");
});

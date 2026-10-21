import { asyncHandler } from "../utils/async-handler.js";
import { ok } from "../utils/api-response.js";
import { getPreferences, updatePreferences } from "../services/jobs/preferences.service.js";
import { refreshScheduler } from "../services/scheduler/scheduler.service.js";

export const getPreferencesHandler = asyncHandler(async (_req, res) => {
  const preferences = await getPreferences();
  return ok(res, preferences);
});

export const updatePreferencesHandler = asyncHandler(async (req, res) => {
  const preferences = await updatePreferences(req.body);
  await refreshScheduler();
  return ok(res, preferences, "Preferences saved");
});

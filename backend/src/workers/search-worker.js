import { SearchRun } from "../models/search-run.model.js";
import { requireProfile } from "../services/resume/resume.service.js";
import { getPreferences } from "../services/jobs/preferences.service.js";
import { runSearchAgent } from "../services/jobs/search-agent.js";
import { logger } from "../config/logger.js";
import { AppError } from "../middleware/error-handler.js";

let activeRunId = null;

export function getActiveRunId() {
  return activeRunId;
}

export async function enqueueSearch(trigger = "manual") {
  if (activeRunId) {
    throw new AppError(409, "A search is already running", { runId: activeRunId });
  }

  const profile = await requireProfile();
  const preferences = await getPreferences();
  const run = await SearchRun.create({ status: "queued", trigger });
  activeRunId = String(run._id);

  setImmediate(() => {
    runSearchAgent({ profile, preferences, trigger, runId: run._id })
      .catch((error) => logger.error({ err: error.message }, "Background search failed"))
      .finally(() => {
        activeRunId = null;
      });
  });

  return run;
}

export async function listRuns() {
  return SearchRun.find().sort({ startedAt: -1 }).limit(20);
}

export async function getRun(id) {
  return SearchRun.findById(id);
}

export async function latestRun() {
  return SearchRun.findOne().sort({ startedAt: -1 });
}

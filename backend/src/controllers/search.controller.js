import { asyncHandler } from "../utils/async-handler.js";
import { accepted, ok } from "../utils/api-response.js";
import { AppError } from "../middleware/error-handler.js";
import { enqueueSearch, getRun, listRuns, latestRun } from "../workers/search-worker.js";

export const runSearchHandler = asyncHandler(async (_req, res) => {
  const run = await enqueueSearch("manual");
  return accepted(res, run, "Search started");
});

export const listRunsHandler = asyncHandler(async (_req, res) => {
  const runs = await listRuns();
  return ok(res, runs);
});

export const getRunHandler = asyncHandler(async (req, res) => {
  const run = await getRun(req.params.id);
  if (!run) throw new AppError(404, "Search run not found");
  return ok(res, run);
});

export const latestRunHandler = asyncHandler(async (_req, res) => {
  const run = await latestRun();
  return ok(res, run);
});

import { asyncHandler } from "../utils/async-handler.js";
import { ok } from "../utils/api-response.js";
import { AppError } from "../middleware/error-handler.js";
import { Job } from "../models/job.model.js";
import { JobMatch } from "../models/job-match.model.js";
import { DailyReport } from "../models/daily-report.model.js";

export const listJobsHandler = asyncHandler(async (req, res) => {
  const latest = await DailyReport.findOne().sort({ createdAt: -1 });
  if (!latest) return ok(res, []);

  const matches = await JobMatch.find({ jobId: { $in: latest.topJobIds } })
    .populate("jobId")
    .sort({ matchScore: -1 });

  const rows = matches
    .filter((item) => item.jobId)
    .map((item, index) => ({
      rank: index + 1,
      job: item.jobId,
      match: item,
    }));
  return ok(res, rows);
});

export const getJobHandler = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new AppError(404, "Job not found");
  const match = await JobMatch.findOne({ jobId: job._id }).sort({ analyzedAt: -1 });
  return ok(res, { job, match });
});

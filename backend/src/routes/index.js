import { Router } from "express";
import { resumeUpload } from "../middleware/upload.js";
import {
  getProfileHandler,
  updateProfileHandler,
  uploadResumeHandler,
} from "../controllers/profile.controller.js";
import { getPreferencesHandler, updatePreferencesHandler } from "../controllers/preferences.controller.js";
import {
  getRunHandler,
  latestRunHandler,
  listRunsHandler,
  runSearchHandler,
} from "../controllers/search.controller.js";
import { getJobHandler, listJobsHandler } from "../controllers/jobs.controller.js";
import { downloadReportHandler, latestReportHandler, listReportsHandler } from "../controllers/reports.controller.js";
import { env } from "../config/env.js";
import mongoose from "mongoose";
import { getEnabledSources } from "../services/job-sources/registry.js";
import { getAIProvider } from "../services/ai/index.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      aiProvider: getAIProvider().name,
      sources: getEnabledSources().map((source) => source.name),
      env: env.NODE_ENV,
    },
  });
});

router.post(
  "/profile/resume",
  (req, res, next) => {
    resumeUpload(req, res, (err) => (err ? next(err) : next()));
  },
  uploadResumeHandler
);
router.get("/profile", getProfileHandler);
router.put("/profile", updateProfileHandler);

router.get("/preferences", getPreferencesHandler);
router.put("/preferences", updatePreferencesHandler);

router.post("/search/run", runSearchHandler);
router.get("/search/runs", listRunsHandler);
router.get("/search/runs/latest", latestRunHandler);
router.get("/search/runs/:id", getRunHandler);

router.get("/jobs", listJobsHandler);
router.get("/jobs/:id", getJobHandler);

router.get("/reports", listReportsHandler);
router.get("/reports/latest", latestReportHandler);
router.get("/reports/:id/download", downloadReportHandler);

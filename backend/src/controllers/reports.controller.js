import { asyncHandler } from "../utils/async-handler.js";
import { ok } from "../utils/api-response.js";
import { getReportFile, listReports, latestReport } from "../services/reports/report.service.js";

export const listReportsHandler = asyncHandler(async (_req, res) => {
  const reports = await listReports();
  return ok(res, reports);
});

export const latestReportHandler = asyncHandler(async (_req, res) => {
  const report = await latestReport();
  return ok(res, report);
});

export const downloadReportHandler = asyncHandler(async (req, res) => {
  const report = await getReportFile(req.params.id);
  res.download(report.filePath, report.fileName);
});

import { DailyReport } from "../../models/daily-report.model.js";
import { JobMatch } from "../../models/job-match.model.js";
import { generateExcelReport } from "./excel.service.js";
import { AppError } from "../../middleware/error-handler.js";

export async function createDailyReport({ run, selected, sourceStats, excluded }) {
  const reportDate = new Date().toISOString().slice(0, 10);
  const { fileName, filePath } = await generateExcelReport({
    reportDate,
    selected,
    sourceStats,
    excluded,
  });

  return DailyReport.create({
    searchRunId: run._id,
    reportDate,
    fileName,
    filePath,
    jobsSelected: selected.length,
    averageMatchScore:
      selected.length === 0
        ? 0
        : Math.round(selected.reduce((sum, item) => sum + item.match.matchScore, 0) / selected.length),
    topJobIds: selected.map((item) => item.job._id),
  });
}

export async function listReports() {
  return DailyReport.find().sort({ createdAt: -1 }).limit(30);
}

export async function getReportFile(id) {
  const report = await DailyReport.findById(id);
  if (!report) throw new AppError(404, "Report not found");
  return report;
}

export async function latestReport() {
  return DailyReport.findOne().sort({ createdAt: -1 });
}

export async function jobsForReport(report) {
  const matches = await JobMatch.find({
    jobId: { $in: report.topJobIds },
  })
    .populate("jobId")
    .sort({ matchScore: -1 });

  return matches
    .filter((item) => item.jobId)
    .map((item) => ({
      job: item.jobId,
      match: item,
    }));
}

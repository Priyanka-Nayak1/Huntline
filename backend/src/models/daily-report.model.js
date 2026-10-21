import mongoose from "mongoose";

const dailyReportSchema = new mongoose.Schema(
  {
    searchRunId: { type: mongoose.Schema.Types.ObjectId, ref: "SearchRun", required: true },
    reportDate: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    jobsSelected: { type: Number, default: 0 },
    averageMatchScore: { type: Number, default: 0 },
    topJobIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  },
  { timestamps: true }
);

dailyReportSchema.index({ createdAt: -1 });

export const DailyReport = mongoose.model("DailyReport", dailyReportSchema);

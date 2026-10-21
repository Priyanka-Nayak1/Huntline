import mongoose from "mongoose";

const sourceStatSchema = new mongoose.Schema(
  {
    source: String,
    jobsFound: { type: Number, default: 0 },
    jobsAfterFiltering: { type: Number, default: 0 },
    jobsAnalyzed: { type: Number, default: 0 },
    jobsSelected: { type: Number, default: 0 },
    error: { type: String, default: "" },
  },
  { _id: false }
);

const searchRunSchema = new mongoose.Schema(
  {
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
      index: true,
    },
    trigger: { type: String, enum: ["manual", "schedule"], default: "manual" },
    jobsDiscovered: { type: Number, default: 0 },
    jobsFiltered: { type: Number, default: 0 },
    jobsAnalyzed: { type: Number, default: 0 },
    jobsSelected: { type: Number, default: 0 },
    averageMatchScore: { type: Number, default: 0 },
    queries: { type: [String], default: [] },
    sourceStats: { type: [sourceStatSchema], default: [] },
    errorList: { type: [String], default: [] },
    message: { type: String, default: "" },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "DailyReport", default: null },
  },
  { timestamps: true }
);

searchRunSchema.index({ startedAt: -1 });
searchRunSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.errors = ret.errorList;
    return ret;
  },
});

export const SearchRun = mongoose.model("SearchRun", searchRunSchema);

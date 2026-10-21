import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    company: { type: String, required: true, index: true },
    location: { type: String, default: "" },
    description: { type: String, default: "" },
    url: { type: String, required: true },
    applicationUrl: { type: String, default: "" },
    source: { type: String, required: true, index: true },
    sourceJobId: { type: String, default: "" },
    employmentType: { type: String, default: "" },
    postedAt: { type: Date, default: null },
    discoveredAt: { type: Date, default: Date.now },
    fingerprint: { type: String, required: true, unique: true },
    salaryText: { type: String, default: "" },
    salaryMin: { type: Number, default: null },
    raw: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true }
);

jobSchema.index({ source: 1, sourceJobId: 1 });
jobSchema.index({ company: 1, title: 1, location: 1 });
jobSchema.index({ discoveredAt: -1 });

export const Job = mongoose.model("Job", jobSchema);

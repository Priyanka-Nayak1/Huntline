import mongoose from "mongoose";

const jobMatchSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    searchRunId: { type: mongoose.Schema.Types.ObjectId, ref: "SearchRun", index: true },
    matchScore: { type: Number, required: true },
    skillScore: { type: Number, required: true },
    experienceScore: { type: Number, required: true },
    roleScore: { type: Number, required: true },
    locationScore: { type: Number, required: true },
    otherScore: { type: Number, default: 0 },
    aiMatchScore: { type: Number, default: null },
    matchingSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    reasons: { type: [String], default: [] },
    recommendation: { type: String, default: "REVIEW" },
    analyzedAt: { type: Date, default: Date.now },
    profileHash: { type: String, required: true, index: true },
    jobFingerprint: { type: String, required: true, index: true },
    provider: { type: String, default: "" },
  },
  { timestamps: true }
);

jobMatchSchema.index({ jobFingerprint: 1, profileHash: 1 }, { unique: true });
jobMatchSchema.index({ matchScore: -1 });

export const JobMatch = mongoose.model("JobMatch", jobMatchSchema);

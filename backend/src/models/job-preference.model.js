import mongoose from "mongoose";
import { JOB_TARGET_DEFAULT, MIN_MATCH_DEFAULT } from "../config/constants.js";

const jobPreferenceSchema = new mongoose.Schema(
  {
    preferredTitles: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    locations: { type: [String], default: [] },
    minExperienceYears: { type: Number, default: 0 },
    maxExperienceYears: { type: Number, default: 10 },
    minMatchScore: { type: Number, default: MIN_MATCH_DEFAULT },
    dailyJobTarget: { type: Number, default: JOB_TARGET_DEFAULT },
    employmentTypes: { type: [String], default: [] },
    remotePreferred: { type: Boolean, default: true },
    excludedCompanies: { type: [String], default: [] },
    minSalary: { type: Number, default: null },
    dailySearchEnabled: { type: Boolean, default: false },
    dailySearchTime: { type: String, default: "08:00" },
  },
  { timestamps: true }
);

export const JobPreference = mongoose.model("JobPreference", jobPreferenceSchema);

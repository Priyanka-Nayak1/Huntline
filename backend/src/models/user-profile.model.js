import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    startDate: String,
    endDate: String,
    description: String,
    technologies: { type: [String], default: [] },
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    startDate: String,
    endDate: String,
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    technologies: { type: [String], default: [] },
  },
  { _id: false }
);

const userProfileSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    professionalSummary: { type: String, default: "" },
    skills: { type: [String], default: [] },
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    certifications: { type: [String], default: [] },
    totalExperienceYears: { type: Number, default: null },
    resume: {
      originalName: String,
      mimeType: String,
      size: Number,
      storedPath: String,
      uploadedAt: Date,
    },
    contentHash: String,
  },
  { timestamps: true }
);

userProfileSchema.index({ updatedAt: -1 });

export const UserProfile = mongoose.model("UserProfile", userProfileSchema);

import multer from "multer";
import { env } from "../config/env.js";
import { UPLOAD_MIME_TYPES } from "../config/constants.js";
import { AppError } from "./error-handler.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const name = (file.originalname || "").toLowerCase();
    const allowedExt = name.endsWith(".pdf") || name.endsWith(".docx");
    if (allowedExt && (UPLOAD_MIME_TYPES.includes(file.mimetype) || file.mimetype === "application/octet-stream")) {
      cb(null, true);
      return;
    }
    cb(new AppError(400, "Only PDF and DOCX resumes are allowed"));
  },
});

export const resumeUpload = upload.single("resume");

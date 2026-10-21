import { ZodError } from "zod";
import multer from "multer";
import { logger } from "../config/logger.js";

export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Invalid input",
      details: err.flatten(),
    });
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Resume file is too large" : err.message;
    return res.status(400).json({ success: false, message });
  }

  const status = err.status || 500;
  const message = status >= 500 ? "Something went wrong" : err.message;
  if (status >= 500) {
    (req.log || logger).error({ err }, "Unhandled error");
  }
  res.status(status).json({
    success: false,
    message,
    details: status >= 500 ? undefined : err.details,
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: "Not found" });
}

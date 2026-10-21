import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { router } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: false,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use((req, _res, next) => {
    req.log = logger;
    next();
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
  app.use("/api", router);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

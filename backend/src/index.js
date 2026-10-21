import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { logger } from "./config/logger.js";
import { createApp } from "./app.js";
import { refreshScheduler } from "./services/scheduler/scheduler.service.js";

const app = createApp();

async function start() {
  await connectDb();
  await refreshScheduler();
  app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`);
  });
}

start().catch((error) => {
  logger.fatal({ err: error }, "Failed to start server");
  process.exit(1);
});

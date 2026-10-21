import cron from "node-cron";
import { logger } from "../../config/logger.js";
import { getPreferences } from "../jobs/preferences.service.js";
import { enqueueSearch } from "../../workers/search-worker.js";

let currentTask = null;
let lastSpec = "";

export async function refreshScheduler() {
  const preferences = await getPreferences();
  const spec = toCron(preferences.dailySearchTime);

  if (!preferences.dailySearchEnabled) {
    stopScheduler();
    logger.info("Daily search scheduler is off");
    return;
  }

  if (currentTask && lastSpec === spec) return;
  stopScheduler();
  currentTask = cron.schedule(spec, async () => {
    logger.info("Scheduled daily search starting");
    try {
      await enqueueSearch("schedule");
    } catch (error) {
      logger.error({ err: error.message }, "Scheduled search could not start");
    }
  });
  lastSpec = spec;
  logger.info({ spec }, "Daily search scheduler registered");
}

export function stopScheduler() {
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
    lastSpec = "";
  }
}

function toCron(hhmm = "08:00") {
  const [hour, minute] = hhmm.split(":").map((part) => Number(part));
  const safeHour = Number.isFinite(hour) ? hour : 8;
  const safeMinute = Number.isFinite(minute) ? minute : 0;
  return `${safeMinute} ${safeHour} * * *`;
}

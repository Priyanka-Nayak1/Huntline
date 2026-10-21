import { logger } from "../../config/logger.js";
import { AdzunaSource } from "./adzuna.source.js";
import { GreenhouseSource } from "./greenhouse.source.js";
import { LeverSource } from "./lever.source.js";
import { RemotiveSource } from "./remotive.source.js";
import { SearchEngineSource } from "./search-engine.source.js";

const sources = [
  new RemotiveSource(),
  new AdzunaSource(),
  new GreenhouseSource(),
  new LeverSource(),
  new SearchEngineSource(),
];

export function getEnabledSources() {
  return sources.filter((source) => source.isEnabled());
}

export async function searchSource(source, criteria) {
  try {
    const jobs = await source.search(criteria);
    return { source: source.name, jobs: jobs || [], error: "" };
  } catch (error) {
    logger.warn({ err: error.message, source: source.name }, "Job source failed");
    return { source: source.name, jobs: [], error: error.message || "Source unavailable" };
  }
}

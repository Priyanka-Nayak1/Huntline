import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { GeminiProvider } from "./gemini.provider.js";
import { HeuristicProvider } from "./heuristic.provider.js";

const heuristic = new HeuristicProvider();
const gemini = new GeminiProvider();

export function getAIProvider() {
  if (env.AI_PROVIDER === "heuristic") {
    logger.info("Using heuristic AI provider");
    return heuristic;
  }
  if (gemini.isConfigured()) return gemini;
  logger.warn("GEMINI_API_KEY is not set; falling back to heuristic matching");
  return heuristic;
}

import { z } from "zod";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/job_search_agent"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z.string().default("info"),

  AI_PROVIDER: z.enum(["gemini", "heuristic"]).default("gemini"),
  GEMINI_API_KEY: z.string().optional().default("").transform((value) => value.trim()),
  GEMINI_BASE_URL: z.string().default("https://generativelanguage.googleapis.com/v1beta"),
  GEMINI_MODEL: z.string().default("gemini-3.6-flash"),

  ADZUNA_APP_ID: z.string().optional().default(""),
  ADZUNA_APP_KEY: z.string().optional().default(""),
  ADZUNA_COUNTRY: z.string().default("in"),

  GOOGLE_CSE_API_KEY: z.string().optional().default(""),
  GOOGLE_CSE_ID: z.string().optional().default(""),

  GREENHOUSE_BOARDS: z.string().optional().default(""),
  LEVER_SITES: z.string().optional().default(""),

  MAX_UPLOAD_MB: z.coerce.number().default(5),
  MATCH_CACHE_DAYS: z.coerce.number().default(14),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

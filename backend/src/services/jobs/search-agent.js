import { AGENT_LIMITS, EXCLUDED_REASONS } from "../../config/constants.js";
import { logger } from "../../config/logger.js";
import { SearchRun } from "../../models/search-run.model.js";
import { getAIProvider } from "../ai/index.js";
import { getEnabledSources, searchSource } from "../job-sources/registry.js";
import { persistJobs, recentlyReportedFingerprints } from "./job.service.js";
import { filterJobs } from "./filter.js";
import { analyzeJobs } from "../matching/matching.service.js";
import { rankAndSelect } from "../matching/ranker.js";
import { createDailyReport } from "../reports/report.service.js";
import { profileHash } from "../../utils/fingerprint.js";
import { uniqueStrings } from "../../utils/sanitize.js";

export async function runSearchAgent({ profile, preferences, trigger = "manual", runId }) {
  const run = await SearchRun.findById(runId);
  if (!run) throw new Error("Search run not found");

  run.status = "running";
  run.startedAt = new Date();
  await run.save();

  const started = Date.now();
  const errors = [];
  const sourceStats = new Map();
  let discovered = [];
  let queriesUsed = [];

  try {
    const provider = getAIProvider();
    queriesUsed = uniqueStrings(await provider.generateSearchQueries(profile, preferences)).slice(
      0,
      AGENT_LIMITS.maxQueries
    );
    if (!queriesUsed.length) {
      queriesUsed = fallbackQueries(preferences);
    }
    run.queries = queriesUsed;
    await run.save();

    const sources = getEnabledSources();
    const waves = [
      sources.filter((source) => ["remotive", "adzuna"].includes(source.name)),
      sources.filter((source) => source.name === "greenhouse"),
      sources.filter((source) => ["lever", "search-engine"].includes(source.name)),
    ].filter((wave) => wave.length);
    const seenFingerprints = await recentlyReportedFingerprints();
    const target = preferences.dailyJobTarget || 20;
    let waveIndex = 0;
    let queryOffset = 0;

    while (Date.now() - started < AGENT_LIMITS.maxExecutionMs) {
      const querySlice = queriesUsed.slice(queryOffset, queryOffset + 3);
      if (!querySlice.length && waveIndex >= waves.length) break;

      const criteria = {
        queries: querySlice.length ? querySlice : queriesUsed,
        locations: preferences.locations || [],
        titles: preferences.preferredTitles || [],
        skills: uniqueStrings([...(preferences.skills || []), ...(profile.skills || [])]),
        remotePreferred: preferences.remotePreferred,
        maxResults: 80,
      };

      const wave = waves[Math.min(waveIndex, waves.length - 1)] || [];
      for (const source of wave) {
        if (discovered.length >= AGENT_LIMITS.maxJobsDiscovered) break;
        const result = await searchSource(source, criteria);
        const stats = sourceStats.get(source.name) || {
          source: source.name,
          jobsFound: 0,
          jobsAfterFiltering: 0,
          jobsAnalyzed: 0,
          jobsSelected: 0,
          error: "",
        };
        stats.jobsFound += result.jobs.length;
        if (result.error) {
          stats.error = result.error;
          errors.push(`${source.name}: ${result.error}`);
        }
        sourceStats.set(source.name, stats);
        discovered = discovered.concat(result.jobs);
      }

      const { saved } = await persistJobs(discovered);
      const { kept } = filterJobs(saved, preferences, seenFingerprints);
      if (kept.length >= target * 2) break;

      queryOffset += 3;
      if (queryOffset >= queriesUsed.length) {
        waveIndex += 1;
        queryOffset = 0;
      }
      if (waveIndex >= waves.length && queryOffset === 0) break;
    }

    const { saved } = await persistJobs(discovered);
    const { kept, excluded: filteredOut } = filterJobs(saved, preferences, seenFingerprints);

    const hash = profileHash(profile, preferences);
    const toAnalyze = kept.slice(0, AGENT_LIMITS.maxJobsToAnalyze);
    const { analyzed, failed } = await analyzeJobs({
      jobs: toAnalyze,
      profile,
      preferences,
      profileHash: hash,
      searchRunId: run._id,
      maxCalls: AGENT_LIMITS.maxAiCalls,
    });

    const { selected, excluded: rankedOut } = rankAndSelect(analyzed, {
      target: preferences.dailyJobTarget || 20,
      minScore: preferences.minMatchScore || 80,
    });

    for (const item of selected) {
      const stats = sourceStats.get(item.job.source);
      if (stats) stats.jobsSelected += 1;
    }
    for (const item of analyzed) {
      const stats = sourceStats.get(item.job.source);
      if (stats) stats.jobsAnalyzed += 1;
    }
    for (const job of kept) {
      const stats = sourceStats.get(job.source);
      if (stats) stats.jobsAfterFiltering += 1;
    }

    const avg =
      selected.length === 0
        ? 0
        : Math.round(selected.reduce((sum, item) => sum + item.match.matchScore, 0) / selected.length);

    const excludedRows = [
      ...filteredOut.map((row) => ({
        title: row.job.title,
        company: row.job.company,
        matchScore: null,
        reason: row.reason,
      })),
      ...failed.map((row) => ({
        title: row.job.title,
        company: row.job.company,
        matchScore: null,
        reason: EXCLUDED_REASONS.AI_FAILED,
      })),
      ...rankedOut.map((row) => ({
        title: row.job.title,
        company: row.job.company,
        matchScore: row.match?.matchScore ?? null,
        reason: row.reason,
      })),
    ].slice(0, 200);

    const report = await createDailyReport({
      run,
      selected,
      sourceStats: [...sourceStats.values()],
      excluded: excludedRows,
    });

    run.status = "completed";
    run.completedAt = new Date();
    run.jobsDiscovered = saved.length;
    run.jobsFiltered = kept.length;
    run.jobsAnalyzed = analyzed.length;
    run.jobsSelected = selected.length;
    run.averageMatchScore = avg;
    run.sourceStats = [...sourceStats.values()];
    run.errorList = errors;
    run.reportId = report._id;
    run.message = selected.length
      ? `Selected ${selected.length} jobs with average match ${avg}%`
      : "Search completed, but no jobs met the minimum match score";
    await run.save();
    return run;
  } catch (error) {
    logger.error({ err: error }, "Search agent failed");
    run.status = "failed";
    run.completedAt = new Date();
    run.errorList = [...errors, error.message];
    run.message = error.message;
    await run.save();
    throw error;
  }
}

function fallbackQueries(preferences) {
  const titles = preferences.preferredTitles?.length ? preferences.preferredTitles : ["Software Engineer"];
  const skills = preferences.skills || [];
  const locations = preferences.locations?.length ? preferences.locations : ["Remote"];
  return uniqueStrings(
    titles.flatMap((title) => locations.map((location) => `${title} ${skills.slice(0, 2).join(" ")} ${location}`))
  ).slice(0, 6);
}

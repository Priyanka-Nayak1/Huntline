import axios from "axios";
import { env } from "../../config/env.js";
import { AGENT_LIMITS } from "../../config/constants.js";
import { logger } from "../../config/logger.js";
import { JobSource } from "./job-source.interface.js";
import { DEFAULT_GREENHOUSE_BOARDS } from "./company-boards.js";

export class GreenhouseSource extends JobSource {
  name = "greenhouse";

  boards() {
    const fromEnv = env.GREENHOUSE_BOARDS
      ? env.GREENHOUSE_BOARDS.split(",").map((item) => item.trim()).filter(Boolean)
      : [];
    return (fromEnv.length ? fromEnv : DEFAULT_GREENHOUSE_BOARDS).slice(0, AGENT_LIMITS.greenhouseBoardLimit);
  }

  async search(criteria) {
    const keywords = buildKeywords(criteria);
    const jobs = [];
    const boards = this.boards();

    await mapLimit(boards, 4, async (board) => {
      try {
        const { data } = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`, {
          timeout: AGENT_LIMITS.sourceTimeoutMs,
        });
        const matches = (data.jobs || []).filter((item) => {
          const blob = `${item.title} ${item.location?.name || ""}`.toLowerCase();
          return !keywords.length || keywords.some((word) => blob.includes(word));
        }).slice(0, 8);

        for (const item of matches) {
          let description = "";
          try {
            const detail = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${item.id}`, {
              timeout: AGENT_LIMITS.sourceTimeoutMs,
            });
            description = stripHtml(detail.data.content || "");
          } catch {
            description = item.title;
          }
          jobs.push({
            title: item.title,
            company: board,
            location: item.location?.name || "",
            description,
            url: item.absolute_url,
            applicationUrl: item.absolute_url,
            source: this.name,
            sourceJobId: String(item.id),
            employmentType: "",
            postedAt: item.updated_at ? new Date(item.updated_at) : null,
          });
        }
      } catch (error) {
        logger.warn({ err: error.message, board }, "Greenhouse board unavailable");
      }
    });

    return jobs.slice(0, criteria.maxResults || 120);
  }
}

function buildKeywords(criteria) {
  return [...(criteria.titles || []), ...(criteria.skills || [])]
    .map((item) => item.toLowerCase())
    .filter((item) => item.length > 2)
    .slice(0, 12);
}

function stripHtml(html) {
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function mapLimit(items, limit, fn) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await fn(item);
    }
  });
  await Promise.all(workers);
}

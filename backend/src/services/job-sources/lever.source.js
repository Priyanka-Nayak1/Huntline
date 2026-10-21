import axios from "axios";
import { env } from "../../config/env.js";
import { AGENT_LIMITS } from "../../config/constants.js";
import { logger } from "../../config/logger.js";
import { JobSource } from "./job-source.interface.js";
import { DEFAULT_LEVER_SITES } from "./company-boards.js";

export class LeverSource extends JobSource {
  name = "lever";

  sites() {
    const fromEnv = env.LEVER_SITES
      ? env.LEVER_SITES.split(",").map((item) => item.trim()).filter(Boolean)
      : [];
    return (fromEnv.length ? fromEnv : DEFAULT_LEVER_SITES).slice(0, AGENT_LIMITS.leverSiteLimit);
  }

  async search(criteria) {
    const keywords = [...(criteria.titles || []), ...(criteria.skills || [])]
      .map((item) => item.toLowerCase())
      .filter((item) => item.length > 2)
      .slice(0, 12);
    const jobs = [];

    await mapLimit(this.sites(), 4, async (site) => {
      try {
        const { data } = await axios.get(`https://api.lever.co/v0/postings/${site}`, {
          params: { mode: "json" },
          timeout: AGENT_LIMITS.sourceTimeoutMs,
        });
        for (const item of data || []) {
          const blob = `${item.text} ${item.categories?.location || ""} ${item.descriptionPlain || ""}`.toLowerCase();
          if (keywords.length && !keywords.some((word) => blob.includes(word))) continue;
          jobs.push({
            title: item.text,
            company: site,
            location: item.categories?.location || "",
            description: item.descriptionPlain || stripHtml(item.description || ""),
            url: item.hostedUrl || item.applyUrl,
            applicationUrl: item.applyUrl || item.hostedUrl,
            source: this.name,
            sourceJobId: String(item.id),
            employmentType: item.categories?.commitment || "",
            postedAt: item.createdAt ? new Date(item.createdAt) : null,
          });
        }
      } catch (error) {
        logger.warn({ err: error.message, site }, "Lever site unavailable");
      }
    });

    return jobs.slice(0, criteria.maxResults || 120);
  }
}

function stripHtml(html) {
  return String(html)
    .replace(/<[^>]+>/g, " ")
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

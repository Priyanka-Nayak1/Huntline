import axios from "axios";
import { env } from "../../config/env.js";
import { AGENT_LIMITS } from "../../config/constants.js";
import { logger } from "../../config/logger.js";
import { JobSource } from "./job-source.interface.js";

/**
 * Uses Google Programmable Search (official API) when configured.
 * Restricted to public job board domains. Does not scrape LinkedIn/Naukri
 * or bypass authentication, CAPTCHA, or anti-bot controls.
 */
export class SearchEngineSource extends JobSource {
  name = "search-engine";

  isEnabled() {
    return Boolean(env.GOOGLE_CSE_API_KEY && env.GOOGLE_CSE_ID);
  }

  async search(criteria) {
    if (!this.isEnabled()) return [];
    const jobs = [];
    const queries = (criteria.queries || []).slice(0, 3);

    for (const query of queries) {
      try {
        const { data } = await axios.get("https://www.googleapis.com/customsearch/v1", {
          params: {
            key: env.GOOGLE_CSE_API_KEY,
            cx: env.GOOGLE_CSE_ID,
            q: `${query} (site:boards.greenhouse.io OR site:jobs.lever.co OR site:remotive.com)`,
            num: 10,
          },
          timeout: AGENT_LIMITS.sourceTimeoutMs,
        });
        for (const item of data.items || []) {
          jobs.push({
            title: item.title?.replace(/ - .*$/, "") || "Job posting",
            company: extractHost(item.link),
            location: "",
            description: item.snippet || "",
            url: item.link,
            applicationUrl: item.link,
            source: this.name,
            sourceJobId: item.cacheId || item.link,
            employmentType: "",
            postedAt: null,
          });
        }
      } catch (error) {
        logger.warn({ err: error.message, query }, "Search engine source failed");
      }
    }
    return jobs;
  }
}

function extractHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

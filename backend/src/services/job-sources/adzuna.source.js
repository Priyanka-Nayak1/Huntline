import axios from "axios";
import { env } from "../../config/env.js";
import { AGENT_LIMITS } from "../../config/constants.js";
import { logger } from "../../config/logger.js";
import { JobSource } from "./job-source.interface.js";

export class AdzunaSource extends JobSource {
  name = "adzuna";

  isEnabled() {
    return Boolean(env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY);
  }

  async search(criteria) {
    if (!this.isEnabled()) return [];
    const jobs = [];
    const queries = (criteria.queries || []).slice(0, 3);
    const where = (criteria.locations || []).find((loc) => !/remote/i.test(loc)) || "";

    for (const query of queries) {
      try {
        const { data } = await axios.get(
          `https://api.adzuna.com/v1/api/jobs/${env.ADZUNA_COUNTRY}/search/1`,
          {
            params: {
              app_id: env.ADZUNA_APP_ID,
              app_key: env.ADZUNA_APP_KEY,
              what: query,
              where,
              results_per_page: 50,
              content_type: "application/json",
            },
            timeout: AGENT_LIMITS.sourceTimeoutMs,
          }
        );
        for (const item of data.results || []) {
          jobs.push({
            title: item.title,
            company: item.company?.display_name || "Unknown",
            location: item.location?.display_name || where,
            description: item.description || "",
            url: item.redirect_url || item.adref || "",
            applicationUrl: item.redirect_url || item.adref || "",
            source: this.name,
            sourceJobId: String(item.id),
            employmentType: item.contract_time || item.contract_type || "",
            postedAt: item.created ? new Date(item.created) : null,
            salaryText: item.salary_min ? `${item.salary_min}-${item.salary_max || ""}` : "",
            salaryMin: item.salary_min || null,
          });
        }
      } catch (error) {
        logger.warn({ err: error.message, query }, "Adzuna search failed for query");
      }
    }
    return jobs.slice(0, criteria.maxResults || 100);
  }
}

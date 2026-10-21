import axios from "axios";
import { JobSource } from "./job-source.interface.js";
import { logger } from "../../config/logger.js";
import { AGENT_LIMITS } from "../../config/constants.js";

const REMOTIVE_URL = "https://remotive.com/api/remote-jobs";

export class RemotiveSource extends JobSource {
  name = "remotive";

  async search(criteria) {
    const jobs = [];
    const queries = (criteria.queries || []).slice(0, 4);
    for (const query of queries) {
      try {
        const { data } = await axios.get(REMOTIVE_URL, {
          params: { search: query },
          timeout: AGENT_LIMITS.sourceTimeoutMs,
        });
        for (const item of data.jobs || []) {
          jobs.push({
            title: item.title,
            company: item.company_name,
            location: item.candidate_required_location || "Remote",
            description: stripHtml(item.description || ""),
            url: item.url,
            applicationUrl: item.url,
            source: this.name,
            sourceJobId: String(item.id),
            employmentType: item.job_type || "",
            postedAt: item.publication_date ? new Date(item.publication_date) : null,
            salaryText: item.salary || "",
          });
        }
      } catch (error) {
        logger.warn({ err: error.message, query }, "Remotive search failed for query");
      }
    }
    return jobs.slice(0, criteria.maxResults || 100);
  }
}

function stripHtml(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

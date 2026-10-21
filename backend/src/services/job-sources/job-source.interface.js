/**
 * @typedef {object} JobSearchCriteria
 * @property {string[]} queries
 * @property {string[]} locations
 * @property {string[]} titles
 * @property {string[]} skills
 * @property {boolean} remotePreferred
 * @property {number} [maxResults]
 */

/**
 * @typedef {object} DiscoveredJob
 * @property {string} title
 * @property {string} company
 * @property {string} [location]
 * @property {string} description
 * @property {string} url
 * @property {string} [applicationUrl]
 * @property {string} source
 * @property {string} [sourceJobId]
 * @property {string} [employmentType]
 * @property {Date|string} [postedAt]
 * @property {string} [salaryText]
 * @property {number} [salaryMin]
 */

/**
 * Every job source must implement:
 *   name: string
 *   isEnabled(): boolean
 *   search(criteria: JobSearchCriteria): Promise<DiscoveredJob[]>
 */
export class JobSource {
  name = "base";

  isEnabled() {
    return true;
  }

  async search(_criteria) {
    throw new Error("search() must be implemented");
  }
}

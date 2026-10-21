const JSON_HEADERS = { "Content-Type": "application/json" };

async function request(path, options = {}) {
  const response = await fetch(path, options);
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;
  if (!response.ok) {
    const error = new Error(payload?.message || "Request failed");
    error.status = response.status;
    error.details = payload?.details;
    throw error;
  }
  return payload?.data;
}

export const api = {
  health: () => request("/api/health"),
  getProfile: () => request("/api/profile"),
  updateProfile: (body) => request("/api/profile", { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(body) }),
  uploadResume: (file) => {
    const form = new FormData();
    form.append("resume", file);
    return request("/api/profile/resume", { method: "POST", body: form });
  },
  getPreferences: () => request("/api/preferences"),
  updatePreferences: (body) =>
    request("/api/preferences", { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(body) }),
  runSearch: () => request("/api/search/run", { method: "POST" }),
  latestRun: () => request("/api/search/runs/latest"),
  listRuns: () => request("/api/search/runs"),
  listJobs: () => request("/api/jobs"),
  getJob: (id) => request(`/api/jobs/${id}`),
  listReports: () => request("/api/reports"),
  latestReport: () => request("/api/reports/latest"),
  downloadUrl: (id) => `/api/reports/${id}/download`,
};

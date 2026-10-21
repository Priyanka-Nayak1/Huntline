export function normalizeWhitespace(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

export function normalizeCompany(value = "") {
  return normalizeWhitespace(value)
    .replace(/[.,]/g, "")
    .replace(/\b(inc|llc|ltd|limited|pvt|private|corp|corporation|co)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeTitle(value = "") {
  return normalizeWhitespace(value)
    .replace(/[^a-z0-9+.# ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeLocation(value = "") {
  return normalizeWhitespace(value)
    .replace(/,+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeUrl(value = "") {
  if (!value) return "";
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/+$/, "").toLowerCase();
  } catch {
    return String(value).trim().toLowerCase().replace(/\/+$/, "");
  }
}

export function looksRemote(text = "") {
  return /\b(remote|work from home|wfh|anywhere)\b/i.test(text);
}

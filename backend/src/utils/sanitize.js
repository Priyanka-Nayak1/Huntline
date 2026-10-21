export function sanitizeText(value, maxLength = 80_000) {
  if (!value) return "";
  return String(value)
    .replace(/\u0000/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function uniqueStrings(values = []) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const trimmed = String(value || "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function asStringArray(value) {
  if (Array.isArray(value)) {
    return uniqueStrings(value.flatMap((item) => String(item).split(/[,|;]/)));
  }
  if (typeof value === "string" && value.trim()) {
    return uniqueStrings(value.split(/[,|;]/));
  }
  return [];
}

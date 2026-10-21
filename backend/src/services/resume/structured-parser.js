import { asStringArray, uniqueStrings } from "../../utils/sanitize.js";

const SECTION_ALIASES = {
  education: "education",
  experience: "experience",
  "work experience": "experience",
  "professional experience": "experience",
  "employment history": "experience",
  projects: "projects",
  "personal projects": "projects",
  skills: "skills",
  "technical skills": "skills",
  "core skills": "skills",
  certifications: "certifications",
  certificates: "certifications",
  summary: "summary",
  "professional summary": "summary",
  objective: "summary",
};

const MONTHS = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const DATE_RANGE_RE =
  /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—to]+\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current|now)/i;

/**
 * Deterministic resume parser for sectioned PDFs (Jake's Resume / MERN SDE style).
 * Used as the base profile so Gemini cannot wipe experience/education when it fails.
 */
export function parseResumeProfile(text) {
  const cleaned = normalizeResumeText(text);
  const sections = splitSections(cleaned);
  const header = sections.header || "";
  const name = extractName(header, cleaned);
  const skills = uniqueStrings([
    ...parseSkillSection(sections.skills || ""),
    ...extractKnownSkills(cleaned),
  ]);
  const experience = parseExperience(sections.experience || "");
  const education = parseEducation(sections.education || "");
  const projects = parseProjects(sections.projects || "");
  const certifications = parseListItems(sections.certifications || "");
  const summarySource = sections.summary || experience[0]?.description || "";

  return {
    name,
    professionalSummary: buildSummary({ name, header, summarySource, skills, experience }),
    skills,
    experience,
    education,
    projects,
    certifications,
    totalExperienceYears: estimateExperienceYears(experience),
  };
}

export function normalizeResumeText(text) {
  return String(text || "")
    .replace(/\u0000/g, "")
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "•")
    .replace(/[–—]/g, "-")
    .replace(/[^\S\n]+/g, " ")
    .replace(/[#ï§�?]/g, " ")
    .split("\n")
    .map((line) => stitchSplitCapitals(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stitchSplitCapitals(line) {
  let previous = "";
  let current = line;
  while (current !== previous) {
    previous = current;
    current = current.replace(/\b([A-Z]) ([A-Z][A-Za-z.+#-]*)\b/g, "$1$2");
  }
  return current;
}

function splitSections(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const buckets = { header: [] };
  let current = "header";

  for (const line of lines) {
    const key = sectionKey(line);
    if (key) {
      current = key;
      if (!buckets[current]) buckets[current] = [];
      continue;
    }
    if (!buckets[current]) buckets[current] = [];
    buckets[current].push(line);
  }

  return Object.fromEntries(Object.entries(buckets).map(([key, value]) => [key, value.join("\n")]));
}

function sectionKey(line) {
  const normalized = line.replace(/[:|]/g, "").trim().toLowerCase();
  const compact = normalized.replace(/\s+/g, "");
  return SECTION_ALIASES[normalized] || SECTION_ALIASES[compact] || null;
}

function extractName(header, fullText) {
  const lines = `${header}\n${fullText}`.split("\n").map((line) => line.trim()).filter(Boolean);
  for (const line of lines.slice(0, 6)) {
    const candidate = line
      .replace(/[^A-Za-z .'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (/^[A-Z][A-Za-z .'-]{1,60}$/.test(candidate) && candidate.split(" ").length >= 2 && candidate.split(" ").length <= 5) {
      return candidate;
    }
  }
  return "";
}

function parseExperience(section) {
  if (!section) return [];
  const lines = section.split("\n").map((line) => line.trim()).filter(Boolean);
  const jobs = [];
  let current = null;

  for (const line of lines) {
    if (/^(onsite|on-site|remote|hybrid)$/i.test(line)) {
      if (current && !current.locationHint) current.locationHint = line;
      continue;
    }
    const heading = parseJobHeading(line);
    if (heading) {
      if (current) jobs.push(finalizeJob(current));
      current = { ...heading, bullets: [] };
      continue;
    }
    if (current) {
      current.bullets.push(line.replace(/^•\s*/, ""));
    }
  }
  if (current) jobs.push(finalizeJob(current));
  return jobs.filter((job) => job.company || job.role);
}

function parseJobHeading(line) {
  if (line.startsWith("•")) return null;
  const dateMatch = line.match(DATE_RANGE_RE);
  const dates = dateMatch ? { startDate: normalizeDateLabel(dateMatch[1]), endDate: normalizeDateLabel(dateMatch[2]) } : {};
  const withoutDates = dateMatch ? line.slice(0, dateMatch.index).trim() : line;
  if (!/[—\-|]/.test(withoutDates) && !dateMatch) return null;

  const parts = withoutDates.split(/\s+[—\-]\s+|\s+—\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const companyPart = parts.length >= 3 ? parts[parts.length - 1] : parts.slice(1).join(" - ");
    const role = parts.length >= 3 ? parts.slice(0, -1).join(" - ") : parts[0];
    const [company, ...locationBits] = companyPart.split(",").map((part) => part.trim());
    return { role, company, location: locationBits.join(", "), ...dates };
  }
  if (dateMatch && withoutDates) {
    return { role: withoutDates, company: "", location: "", ...dates };
  }
  return null;
}

function finalizeJob(job) {
  const technologies = extractKnownSkills(job.bullets.join(" "));
  return {
    company: job.company || "Unknown",
    role: job.role,
    startDate: job.startDate || "",
    endDate: job.endDate || "",
    description: job.bullets.join(" ").trim(),
    technologies,
  };
}

function parseEducation(section) {
  if (!section) return [];
  const lines = section.split("\n").map((line) => line.trim()).filter(Boolean);
  const items = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const year = (line.match(/\b(19|20)\d{2}\b/) || [])[0];
    const next = lines[i + 1] || "";
    const nextLooksLikeDegree = isDegreeLine(next);
    if (nextLooksLikeDegree) {
      items.push({
        institution: line.replace(/\b(19|20)\d{2}\b/g, "").trim(),
        degree: next.replace(/\bCGPA\b.*$/i, "").trim(),
        endDate: year || (next.match(/\b(19|20)\d{2}\b/) || [])[0] || "",
      });
      i += 1;
      continue;
    }
    if (isDegreeLine(line)) {
      items.push({
        degree: line.replace(/\b(19|20)\d{2}\b/g, "").replace(/\bCGPA\b.*$/i, "").trim(),
        institution: "",
        endDate: year || "",
      });
    }
  }
  return items.filter((item) => item.degree || item.institution);
}

function isDegreeLine(line) {
  return /\b(bachelors?|masters?|b\.?\s?tech|m\.?\s?tech|b\.?\s?sc|m\.?\s?sc|mca|bca|mba|ph\.?d|hons|honours?|degree)\b/i.test(
    line
  );
}

function parseProjects(section) {
  if (!section) return [];
  const lines = section.split("\n").map((line) => line.trim()).filter(Boolean);
  const projects = [];
  let current = null;

  for (const line of lines) {
    if (!line.startsWith("•") && (line.includes("|") || /link$/i.test(line))) {
      if (current) projects.push(current);
      const [namePart, techPart] = line.split("|").map((part) => part.trim());
      current = {
        name: namePart.replace(/\s*link$/i, "").trim(),
        description: "",
        technologies: asStringArray((techPart || "").replace(/\s*link$/i, "")),
      };
      continue;
    }
    if (current) {
      current.description = [current.description, line.replace(/^•\s*/, "")].filter(Boolean).join(" ");
    }
  }
  if (current) projects.push(current);
  return projects.filter((item) => item.name);
}

function parseSkillSection(section) {
  if (!section) return [];
  const values = [];
  for (const line of section.split("\n")) {
    const payload = line.replace(/^•\s*/, "").replace(/^[^:]+:/, "");
    values.push(...asStringArray(payload));
  }
  return values;
}

function parseListItems(section) {
  return uniqueStrings(
    (section || "")
      .split("\n")
      .map((line) => line.replace(/^•\s*/, "").trim())
      .filter(Boolean)
  );
}

const KNOWN_SKILLS = [
  "React",
  "React.js",
  "Next.js",
  "Node.js",
  "Express",
  "Express.js",
  "MongoDB",
  "MERN",
  "TypeScript",
  "JavaScript",
  "Python",
  "C++",
  "Java",
  "Angular",
  "Tailwind CSS",
  "Tailwind",
  "Material UI",
  "Azure AD",
  "Azure SSO",
  "Azure DevOps",
  "LLM",
  "RAG",
  "ChromaDB",
  "SQL",
  "JWT",
  "Cloudinary",
  "Contentful",
  "FastAPI",
  "Whisper",
  "GitHub",
  "Postman",
  "Vite",
  "MCP",
];

function extractKnownSkills(text) {
  const haystack = String(text || "");
  return KNOWN_SKILLS.filter((skill) => new RegExp(`\\b${escapeRegex(skill)}\\b`, "i").test(haystack));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDateLabel(value) {
  const raw = String(value || "").trim();
  if (/present|current|now/i.test(raw)) return "Present";
  return raw.replace(/\s+/g, " ");
}

function estimateExperienceYears(experience) {
  let months = 0;
  for (const job of experience) {
    const start = parseMonthYear(job.startDate);
    const end = /present/i.test(job.endDate || "") ? new Date() : parseMonthYear(job.endDate);
    if (!start || !end || end < start) continue;
    months += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  }
  if (!months) return null;
  return Math.round((months / 12) * 10) / 10;
}

function parseMonthYear(value) {
  if (!value) return null;
  const match = String(value).match(/([a-z]+)?\s*(\d{4})/i);
  if (!match) return null;
  const month = match[1] ? MONTHS[match[1].toLowerCase().slice(0, 3)] ?? 0 : 0;
  return new Date(Number(match[2]), month, 1);
}

function buildSummary({ name, header, summarySource, skills, experience }) {
  if (summarySource && summarySource.length > 80 && !/linkedin|github|@/.test(summarySource.slice(0, 80))) {
    return summarySource.slice(0, 600);
  }
  const role = experience[0]?.role;
  const company = experience[0]?.company;
  const skillPreview = skills.slice(0, 8).join(", ");
  const bits = [
    name && role ? `${name} is a ${role}${company ? ` at ${company}` : ""}` : name,
    skillPreview ? `Skills include ${skillPreview}` : "",
  ].filter(Boolean);
  const location = header.split("\n")[1] || "";
  if (location && !/@/.test(location)) bits.push(`Based in ${location.replace(/\d{6}/, "").trim()}`);
  return bits.join(". ").slice(0, 600);
}

import { SCORE_WEIGHTS } from "../../config/constants.js";

export function calculateFinalScore(signals) {
  const skill = clamp(signals.skillMatchScore);
  const experience = clamp(signals.experienceMatchScore);
  const role = clamp(signals.roleMatchScore);
  const location = clamp(signals.locationMatchScore);
  const other = clamp(signals.otherScore ?? 50);

  const finalScore =
    skill * SCORE_WEIGHTS.skill +
    experience * SCORE_WEIGHTS.experience +
    role * SCORE_WEIGHTS.role +
    location * SCORE_WEIGHTS.location +
    other * SCORE_WEIGHTS.other;

  return {
    matchScore: Math.round(finalScore),
    skillScore: skill,
    experienceScore: experience,
    roleScore: role,
    locationScore: location,
    otherScore: other,
    aiMatchScore: signals.matchScore ?? null,
    matchingSkills: intersectWithKnown(signals.matchingSkills, signals.knownSkills),
    missingSkills: signals.missingSkills || [],
    reasons: (signals.reasons || []).slice(0, 6),
    recommendation: signals.recommendation || "REVIEW",
  };
}

function clamp(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function intersectWithKnown(claimed = [], known = []) {
  if (!known.length) return claimed.slice(0, 20);
  const knownSet = new Set(known.map((item) => item.toLowerCase()));
  return claimed.filter((item) => knownSet.has(String(item).toLowerCase())).slice(0, 20);
}

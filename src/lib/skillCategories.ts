/**
 * Heuristic soft vs hard skill classification for hiring-signal skill_tags.
 * Tags not matching either list are treated as "other" for split charts.
 */

export type SkillCategory = "soft" | "hard" | "other";

const SOFT_KEYWORDS = new Set<string>([
  "communication",
  "training",
  "operations",
  "management",
  "leadership",
  "sales",
  "business",
  "problem",
  "learning",
  "planning",
  "collaboration",
  "customer service",
  "negotiation",
  "presentation",
  "teamwork",
  "interpersonal",
  "listening",
  "empathy",
  "adaptability",
  "time management",
  "organization",
  "mentoring",
  "coaching",
  "facilitation",
]);

const HARD_KEYWORDS = new Set<string>([
  "compliance",
  "engineering",
  "software",
  "production",
  "marketing",
  "it",
  "legal",
  "python",
  "java",
  "javascript",
  "typescript",
  "react",
  "aws",
  "azure",
  "gcp",
  "kubernetes",
  "docker",
  "sql",
  "security",
  "network",
  "database",
  "api",
  "cloud computing",
  "machine learning",
  "data science",
  "devops",
  "ci/cd",
  "terraform",
  "ansible",
  "linux",
  "windows server",
  "sap",
  "salesforce",
]);

export function classifySkillTag(raw: string): SkillCategory {
  const s = raw.trim().toLowerCase();
  if (!s) return "other";
  if (SOFT_KEYWORDS.has(s)) return "soft";
  if (HARD_KEYWORDS.has(s)) return "hard";
  // substring fallbacks for compound tags
  for (const k of SOFT_KEYWORDS) {
    if (s.includes(k)) return "soft";
  }
  for (const k of HARD_KEYWORDS) {
    if (s.includes(k)) return "hard";
  }
  return "other";
}

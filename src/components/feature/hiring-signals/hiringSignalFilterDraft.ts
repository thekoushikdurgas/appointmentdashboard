/** LinkedIn-style quick date window — maps to `postedAfter` (RFC3339 rolling cutoff). */
export type DatePostedPreset = "any" | "24h" | "7d" | "30d" | "custom";

export type HiringSignalFilterDraft = {
  /** Role keywords / full titles — multi-select, OR within this field when applied. */
  titles: string[];
  companies: string[];
  locations: string[];
  /**
   * Legacy single-value employment type (still merged into `employmentTypes` on apply when
   * `employmentTypes` is empty).
   */
  employmentType: string;
  /** Multi-select employment types (OR). Takes precedence over `employmentType`. */
  employmentTypes: string[];
  /** Workplace: Remote / Hybrid / On-site — matches job.server `workplace_types`. Sidebar uses one dropdown (stored as 0 or 1 entry). */
  workplaceTypes: string[];
  /** Substring on job `industries` text; sidebar uses 0 or 1 curated token via select. */
  industries: string[];
  excludedIndustries: string[];
  excludedTitles: string[];
  excludedCompanies: string[];
  excludedLocations: string[];
  /** Minimum salary (USD), plain number string — applied as `salaryMin` when parseable. */
  salaryMin: string;
  /** Ingest enum; sidebar stores 0 or 1 bucket via single select. */
  experienceBuckets: string[];
  /** IC vs manager track; sidebar stores 0 or 1 via single select. */
  roleTracks: string[];
  educationLevelMins: string[];
  /** All must match ingested skill tags; values match job.server extractSkillTags keywords; 0 or 1 via select. */
  skillsAll: string[];
  /** Tri-state: allow (default) = no filter; hide / only for clearance-derived field. */
  clearanceMode: "" | "allow" | "hide" | "only";
  h1bOnly: boolean;
  seniorityPreset: string;
  seniorityCustom: string;
  functionPreset: string;
  functionCustom: string;
  /** Lower bound: RFC3339 when driven by quick presets; YYYY-MM-DD from custom date picker. */
  postedAfter: string;
  /** Upper bound: YYYY-MM-DD (date picker) or RFC3339; job.server accepts both. */
  postedBefore: string;
  /** ISO codes; substring match on job.country; sidebar allows multiple (OR). */
  countries: string[];
  /** LinkedIn-style apply method token (substring match on apply_method). */
  applyMethod: string;

  /** Quick date filter row — drives `postedAfter` unless `custom`. */
  datePostedPreset: DatePostedPreset;
};

export const EMPTY_HIRING_SIGNAL_DRAFT: HiringSignalFilterDraft = {
  titles: [],
  companies: [],
  locations: [],
  employmentType: "",
  employmentTypes: [],
  workplaceTypes: [],
  industries: [],
  excludedIndustries: [],
  excludedTitles: [],
  excludedCompanies: [],
  excludedLocations: [],
  salaryMin: "",
  experienceBuckets: [],
  roleTracks: [],
  educationLevelMins: [],
  skillsAll: [],
  clearanceMode: "",
  h1bOnly: false,
  seniorityPreset: "",
  seniorityCustom: "",
  functionPreset: "",
  functionCustom: "",
  postedAfter: "",
  postedBefore: "",
  countries: [],
  applyMethod: "",
  datePostedPreset: "any",
};

export type HiringSignalDraftField = keyof HiringSignalFilterDraft;

/** Start of today in UTC (midnight). */
function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Lower bound for quick "Date posted" presets → job.server `posted_after` (RFC3339).
 * Uses **UTC calendar-day** windows so the table (day-granular "Posted" labels) matches
 * what users expect; a strict rolling 24h window excluded jobs still showing as "yesterday"
 * or a few calendar days ago.
 */
export function postedAfterISOFromPreset(
  preset: Exclude<DatePostedPreset, "any" | "custom">,
): string {
  const d = startOfTodayUTC();
  if (preset === "24h") {
    d.setUTCDate(d.getUTCDate() - 3);
    return d.toISOString();
  }
  if (preset === "7d") {
    d.setUTCDate(d.getUTCDate() - 6);
    return d.toISOString();
  }
  d.setUTCDate(d.getUTCDate() - 29);
  return d.toISOString();
}

/** Map draft `postedAfter` / `postedBefore` (RFC3339 or YYYY-MM-DD) to `<input type="date" />` value. */
export function postedAtBoundToDateInputValue(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const ms = Date.parse(t);
  if (Number.isNaN(ms)) return "";
  return new Date(ms).toISOString().slice(0, 10);
}

/** Trim, drop empty, dedupe (preserve order). */
export function normalizeHiringSignalTokenList(arr: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of arr) {
    const t = s.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

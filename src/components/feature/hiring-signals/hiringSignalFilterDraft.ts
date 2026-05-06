/** LinkedIn-style quick date window — maps to `postedAfter` (RFC3339 rolling cutoff). */
export type DatePostedPreset = "any" | "24h" | "7d" | "30d" | "custom";

/** Drives `extendedJobFilters.postedAtOrder` → job.server `posted_at` sort. */
export type ListSortPreference = "recent" | "oldest";

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
  /** ISO codes; substring match on job.country; sidebar uses 0 or 1 via select. */
  countries: string[];
  /** LinkedIn-style apply method token (substring match on apply_method). */
  applyMethod: string;

  /** Quick date filter row — drives `postedAfter` unless `custom`. */
  datePostedPreset: DatePostedPreset;

  /** Sort: `recent` = newest `posted_at` first; `oldest` = sent as `extendedJobFilters.postedAtOrder` → job.server. */
  listSort: ListSortPreference;
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
  listSort: "recent",
};

export type HiringSignalDraftField = keyof HiringSignalFilterDraft;

/** Rolling window start instant as ISO string for job.server `posted_after`. */
export function postedAfterISOFromPreset(preset: Exclude<DatePostedPreset, "any" | "custom">): string {
  const now = Date.now();
  const ms =
    preset === "24h"
      ? 24 * 60 * 60 * 1000
      : preset === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
  return new Date(now - ms).toISOString();
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

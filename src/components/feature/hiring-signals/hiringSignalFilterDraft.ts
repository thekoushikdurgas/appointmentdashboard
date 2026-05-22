/** LinkedIn-style quick date window — maps to `postedAfter` (RFC3339). Preset `24h` uses a rolling 4×24h bound; `7d`/`30d` use UTC calendar days from midnight today. */
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
  /** Category (topic) — substring on job `industries`; sidebar uses 0 or 1 curated token via select. */
  industries: string[];
  excludedIndustries: string[];
  excludedTitles: string[];
  excludedCompanies: string[];
  excludedLocations: string[];
  /** "" = any; preset min USD string (e.g. "80000"); "custom" = use salaryMin/salaryMax inputs. */
  salaryPreset: string;
  /** Custom range min (USD/year). */
  salaryMin: string;
  /** Custom range max (USD/year). */
  salaryMax: string;
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

  /**
   * Company names from job index facets (`company_name.keyword` + job count in UI).
   * Resolved to Connectra companies via VQL `name` eq/in, then jobs filter by `company_uuid`.
   */
  companyNames: string[];
  /** Connectra company names to exclude (resolved to `excludedCompanyUuids` on jobs). */
  excludedCompanyNames: string[];
  /** Funding bucket ids (include), e.g. `1000000-10000000`, `1000000000+`. */
  companyFunding: string[];
  /** Funding bucket ids (exclude). */
  excludedCompanyFunding: string[];
  /** Connectra `country` tokens (include). */
  companyCountries: string[];
  /** Connectra `country` tokens (exclude). */
  excludedCompanyCountries: string[];
  /** Connectra `industries` tokens (include). */
  companyIndustries: string[];
  /** Connectra `industries` tokens (exclude). */
  excludedCompanyIndustries: string[];
  /** Employee-size bucket ids (include), e.g. `10-100`, `10000+`. */
  companyEmployeeSizes: string[];
  /** Employee-size bucket ids (exclude). */
  excludedCompanyEmployeeSizes: string[];
  /** Connectra company-index facets (revenue, etc.). */
  companyFacetValues: Record<string, string[]>;
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
  salaryPreset: "",
  salaryMin: "",
  salaryMax: "",
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
  companyNames: [],
  excludedCompanyNames: [],
  companyFunding: [],
  excludedCompanyFunding: [],
  companyCountries: [],
  excludedCompanyCountries: [],
  companyIndustries: [],
  excludedCompanyIndustries: [],
  companyEmployeeSizes: [],
  excludedCompanyEmployeeSizes: [],
  companyFacetValues: {},
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
 * **`24h` (UI "Last 4 days"):** rolling **4×24h** from now so rows with `postedAt` a few UTC
 * calendar days ago (but still "recent" in the grid) are not excluded by `startOfTodayUTC()−3`.
 * **`7d` / `30d`:** UTC calendar windows from start of today (inclusive day counts).
 */
export function postedAfterISOFromPreset(
  preset: Exclude<DatePostedPreset, "any" | "custom">,
): string {
  if (preset === "24h") {
    const ms = Date.now() - 4 * 24 * 60 * 60 * 1000;
    return new Date(ms).toISOString();
  }
  const d = startOfTodayUTC();
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
export function parseSalaryUsdInput(raw: string): number | undefined {
  const n = Math.floor(Number(String(raw).trim()));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Resolve salary bounds from preset dropdown and/or custom min/max fields. */
export function resolveSalaryBoundsFromDraft(draft: HiringSignalFilterDraft): {
  salaryMin?: number;
  salaryMax?: number;
} {
  const preset = draft.salaryPreset.trim();
  if (preset === "custom") {
    return {
      salaryMin: parseSalaryUsdInput(draft.salaryMin),
      salaryMax: parseSalaryUsdInput(draft.salaryMax),
    };
  }
  if (preset !== "") {
    const n = parseSalaryUsdInput(preset);
    if (n != null) {
      return { salaryMin: n };
    }
  }
  return {
    salaryMin: parseSalaryUsdInput(draft.salaryMin),
    salaryMax: parseSalaryUsdInput(draft.salaryMax),
  };
}

export function formatSalaryUsdLabel(n: number): string {
  if (n >= 1000 && n % 1000 === 0) {
    return `$${n / 1000}k`;
  }
  return `$${n.toLocaleString("en-US")}`;
}

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

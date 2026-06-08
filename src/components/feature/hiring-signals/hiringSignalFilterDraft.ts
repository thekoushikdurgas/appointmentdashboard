/** Quick date windows — map to `postedAfter` / `postedBefore` (RFC3339 with local offset). */
export type DatePostedPreset =
  | "any"
  | "today"
  | "yesterday"
  | "7d"
  | "15d"
  | "30d"
  | "custom_range";

/** Presets that auto-compute bounds via `postedBoundsFromPreset` (not custom pickers). */
export const DATE_POSTED_QUICK_PRESETS = [
  "today",
  "yesterday",
  "7d",
  "15d",
  "30d",
] as const;

export type DatePostedQuickPreset = (typeof DATE_POSTED_QUICK_PRESETS)[number];

export function isQuickDatePostedPreset(
  preset: DatePostedPreset,
): preset is DatePostedQuickPreset {
  return (DATE_POSTED_QUICK_PRESETS as readonly string[]).includes(preset);
}

export type PostedDateBounds = {
  postedAfter: string;
  postedBefore: string;
};

export const DATE_POSTED_PRESET_LABELS: Record<
  Exclude<DatePostedPreset, "any">,
  string
> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 Days",
  "15d": "Last 15 Days",
  "30d": "Last 30 Days",
  custom_range: "Custom Range",
};

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

  /** Quick date filter row — drives `postedAfter` / `postedBefore` unless custom pickers. */
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
  /** Revenue bucket ids (include), e.g. `1000000-10000000`. */
  companyRevenue: string[];
  /** Revenue bucket ids (exclude). */
  excludedCompanyRevenue: string[];
  /** Companies with no website (null / empty) — job list scoped by company_uuid. */
  companyMissingWebsite: boolean;
  /** Companies with no annual_revenue (null / 0) — job list scoped by company_uuid. */
  companyMissingRevenue: boolean;
  /** C-Suite contacts under this count per company (`null` = off; `0` = none). */
  companyCsuiteContactMinCount: number | null;
  /** HR contacts under this count per company (`null` = off; `0` = none). */
  companyHrContactMinCount: number | null;
  /** Legacy Connectra facet values (unused — firmographics use dedicated fields). */
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
  companyRevenue: [],
  excludedCompanyRevenue: [],
  companyMissingWebsite: false,
  companyMissingRevenue: false,
  companyCsuiteContactMinCount: null,
  companyHrContactMinCount: null,
  companyFacetValues: {},
};

export type HiringSignalDraftField = keyof HiringSignalFilterDraft;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** RFC3339 with local timezone offset (job.server accepts via `parsePostedBound`). */
export function toLocalRFC3339(date: Date): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const h = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  const s = pad2(date.getSeconds());
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const offH = pad2(Math.floor(abs / 60));
  const offM = pad2(abs % 60);
  return `${y}-${m}-${d}T${h}:${min}:${s}.${ms}${sign}${offH}:${offM}`;
}

export function startOfLocalDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfLocalDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Bounds for quick "Date posted" presets using the user's local calendar.
 * Rolling windows (`7d` / `15d` / `30d`) are inclusive from local midnight (N−1) days ago through end of today.
 */
export function postedBoundsFromPreset(
  preset: DatePostedQuickPreset,
  now: Date = new Date(),
): PostedDateBounds {
  switch (preset) {
    case "today":
      return {
        postedAfter: toLocalRFC3339(startOfLocalDay(now)),
        postedBefore: toLocalRFC3339(endOfLocalDay(now)),
      };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return {
        postedAfter: toLocalRFC3339(startOfLocalDay(y)),
        postedBefore: toLocalRFC3339(endOfLocalDay(y)),
      };
    }
    case "7d":
    case "15d":
    case "30d": {
      const days = preset === "7d" ? 7 : preset === "15d" ? 15 : 30;
      const start = new Date(now);
      start.setDate(start.getDate() - (days - 1));
      return {
        postedAfter: toLocalRFC3339(startOfLocalDay(start)),
        postedBefore: toLocalRFC3339(endOfLocalDay(now)),
      };
    }
  }
}

/** Map draft `postedAfter` / `postedBefore` (RFC3339 or YYYY-MM-DD) to `<input type="date" />` value. */
export function postedAtBoundToDateInputValue(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  // RFC3339 with explicit offset: calendar day is the local date encoded in the string.
  const withOffset = /^(\d{4}-\d{2}-\d{2})T/.exec(t);
  if (withOffset && /[+-]\d{2}:\d{2}$/.test(t)) {
    return withOffset[1];
  }
  const ms = Date.parse(t);
  if (Number.isNaN(ms)) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
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

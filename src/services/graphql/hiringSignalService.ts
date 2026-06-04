/**
 * Hiring signal — GraphQL to gateway `hireSignal` (scrape via scraper.server, reads via job.server).
 */

import { gql } from "graphql-request";
import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";
/** Hiring-signal operations: hooks/modals show toasts; avoid duplicate client toasts. */
const HS_GQL = { showToastOnError: false as const };

/**
 * Page size for client-side analytics surfaces (Demands & Trends, Market Insights).
 * Must stay at or below job.server `List` max page size.
 */
export const HIRE_SIGNAL_ANALYTICS_FETCH_LIMIT = 10_000;

// --- response shapes (JSON scalars from gateway) ---

export type HireSignalApiJson = Record<string, unknown> | null | unknown[];

export function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/** Normalized rows + total from `hireSignal.runs` JSON (scraper.server sessions envelope). */
export function hireSignalRunsFromJson(raw: HireSignalApiJson): {
  rows: Record<string, unknown>[];
  total: number;
} {
  if (Array.isArray(raw)) {
    const rows = raw.filter(
      (x): x is Record<string, unknown> =>
        !!x && typeof x === "object" && !Array.isArray(x),
    );
    return { rows, total: rows.length };
  }
  const r = asRecord(raw);
  const data = r?.data;
  const rows = Array.isArray(data)
    ? data.filter(
        (x): x is Record<string, unknown> =>
          !!x && typeof x === "object" && !Array.isArray(x),
      )
    : [];
  const total = typeof r?.total === "number" ? r.total : rows.length;
  return { rows, total };
}

/** Typed envelope for `hireSignal.jobs` list payload. */
export function hireSignalJobsListFromJson(raw: HireSignalApiJson): {
  success: boolean;
  data: unknown[];
  total: number;
} {
  const r = asRecord(raw);
  const data = (r?.data as unknown) ?? [];
  const arr = Array.isArray(data) ? data : [];
  return {
    success: Boolean(r?.success),
    data: arr,
    total: typeof r?.total === "number" ? r.total : 0,
  };
}

// --- operations ---

const HIRE_SIGNAL_JOBS = gql`
  query HireSignalJobs(
    $limit: Int
    $offset: Int
    $titles: [String!]
    $companies: [String!]
    $locations: [String!]
    $employmentType: String
    $seniority: String
    $functionCategory: String
    $postedAfter: String
    $postedBefore: String
    $runId: String
    $extendedJobFilters: JSON
    $hideApplied: Boolean
    $companyUuids: [String!]
    $searchTokens: [String!]
  ) {
    hireSignal {
      jobs(
        limit: $limit
        offset: $offset
        titles: $titles
        companies: $companies
        locations: $locations
        employmentType: $employmentType
        seniority: $seniority
        functionCategory: $functionCategory
        postedAfter: $postedAfter
        postedBefore: $postedBefore
        runId: $runId
        extendedJobFilters: $extendedJobFilters
        hideApplied: $hideApplied
        companyUuids: $companyUuids
        searchTokens: $searchTokens
      )
    }
  }
`;

const HIRE_SIGNAL_RESOLVE_COMPANY_COHORT = gql`
  query HireSignalResolveCompanyCohort($cohortFilters: JSON) {
    hireSignal {
      resolveCompanyCohortUuids(cohortFilters: $cohortFilters)
    }
  }
`;

const HIRE_SIGNAL_JOB_FILTER_OPTIONS = gql`
  query HireSignalJobFilterOptions(
    $field: String!
    $q: String
    $optionLimit: Int
    $optionOffset: Int
    $titles: [String!]
    $companies: [String!]
    $locations: [String!]
    $employmentType: String
    $seniority: String
    $functionCategory: String
    $postedAfter: String
    $postedBefore: String
    $runId: String
    $extendedJobFilters: JSON
    $hideApplied: Boolean
    $companyUuids: [String!]
    $searchTokens: [String!]
  ) {
    hireSignal {
      jobFilterOptions(
        field: $field
        q: $q
        limit: $optionLimit
        optionOffset: $optionOffset
        titles: $titles
        companies: $companies
        locations: $locations
        employmentType: $employmentType
        seniority: $seniority
        functionCategory: $functionCategory
        postedAfter: $postedAfter
        postedBefore: $postedBefore
        runId: $runId
        extendedJobFilters: $extendedJobFilters
        hideApplied: $hideApplied
        companyUuids: $companyUuids
        searchTokens: $searchTokens
      )
    }
  }
`;

const HIRE_SIGNAL_SUGGEST_RESUME = gql`
  mutation HireSignalSuggestResume($fileBase64: String!, $fileName: String) {
    hireSignal {
      suggestHireSignalFiltersFromResumeUpload(
        fileBase64: $fileBase64
        fileName: $fileName
      )
    }
  }
`;

const HIRE_SIGNAL_STATS = gql`
  query HireSignalStats {
    hireSignal {
      stats
    }
  }
`;

const HIRE_SIGNAL_DASHBOARD_KPIS = gql`
  query HireSignalDashboardKpis {
    hireSignal {
      dashboardKpis
    }
  }
`;

const HIRE_SIGNAL_COMPANY_JOBS = gql`
  query HireSignalCompanyJobs($companyUuid: String!, $limit: Int) {
    hireSignal {
      companyJobs(companyUuid: $companyUuid, limit: $limit)
    }
  }
`;

const HIRE_SIGNAL_TRIGGER = gql`
  mutation HireSignalTrigger($body: JSON) {
    hireSignal {
      triggerScrape(body: $body)
    }
  }
`;

const HIRE_SIGNAL_TRIGGER_TRACK = gql`
  mutation HireSignalTriggerTrack($body: JSON) {
    hireSignal {
      triggerScrapeAndTrack(body: $body) {
        id
        userId
        status
        runId
        error
        createdAt
        scraperResponse
      }
    }
  }
`;

const HIRE_SIGNAL_RUN_CANCEL = gql`
  mutation HireSignalCancelRun($runId: String!) {
    hireSignal {
      cancelHireSignalRun(runId: $runId)
    }
  }
`;

const HIRE_SIGNAL_RUN_PAUSE = gql`
  mutation HireSignalPauseRun($runId: String!) {
    hireSignal {
      pauseHireSignalRun(runId: $runId)
    }
  }
`;

const HIRE_SIGNAL_RUN_RESUME = gql`
  mutation HireSignalResumeRun($runId: String!) {
    hireSignal {
      resumeHireSignalRun(runId: $runId)
    }
  }
`;

const HIRE_SIGNAL_RUN_METRICS = gql`
  query HireSignalQueueMetrics {
    hireSignal {
      hireSignalRunMetrics
    }
  }
`;

const HIRE_SIGNAL_GET_SCRAPE_JOB = gql`
  query HireSignalGetScrapeJob($scrapeJobId: String!, $pollRun: Boolean) {
    hireSignal {
      getScrapeJob(scrapeJobId: $scrapeJobId, pollRun: $pollRun)
    }
  }
`;

const HIRE_SIGNAL_RUNS = gql`
  query HireSignalRuns($limit: Int, $offset: Int) {
    hireSignal {
      runs(limit: $limit, offset: $offset)
    }
  }
`;

const HIRE_SIGNAL_RUN = gql`
  query HireSignalRun($runId: String!) {
    hireSignal {
      run(runId: $runId)
    }
  }
`;

const HIRE_SIGNAL_RUN_REFRESH = gql`
  query HireSignalRunRefresh($runId: String!) {
    hireSignal {
      refreshHireSignalRun(runId: $runId)
    }
  }
`;

const HIRE_SIGNAL_LIST_SCRAPE_JOBS = gql`
  query HireSignalListScrapeJobs($limit: Int, $offset: Int) {
    hireSignal {
      listScrapeJobs(limit: $limit, offset: $offset)
    }
  }
`;

const HIRE_SIGNAL_SCRAPE_JOB_JOBS = gql`
  query HireSignalScrapeJobJobs(
    $scrapeJobId: String!
    $limit: Int
    $offset: Int
  ) {
    hireSignal {
      scrapeJobJobs(scrapeJobId: $scrapeJobId, limit: $limit, offset: $offset)
    }
  }
`;

/** Proxies job.server → Connectra (sync.server); needs CONNECTRA_* on job.server. */
const HIRE_SIGNAL_JOB_CONNECTRA_COMPANY = gql`
  query HireSignalJobConnectraCompany($linkedinJobId: String!) {
    hireSignal {
      jobConnectraCompany(linkedinJobId: $linkedinJobId)
    }
  }
`;

const HIRE_SIGNAL_JOB_CONNECTRA_CONTACTS = gql`
  query HireSignalJobConnectraContacts(
    $linkedinJobId: String!
    $page: Int
    $limit: Int
    $populateCompany: Boolean
    $includePoster: Boolean
    $title: String
    $departments: [String!]
  ) {
    hireSignal {
      jobConnectraContacts(
        linkedinJobId: $linkedinJobId
        page: $page
        limit: $limit
        populateCompany: $populateCompany
        includePoster: $includePoster
        title: $title
        departments: $departments
      )
    }
  }
`;

const HIRE_SIGNAL_CONNECTRA_COMPANY = gql`
  query HireSignalConnectraCompany($companyUuid: String!) {
    hireSignal {
      connectraCompany(companyUuid: $companyUuid)
    }
  }
`;

const HIRE_SIGNAL_CONNECTRA_CONTACTS_FOR_COMPANY = gql`
  query HireSignalConnectraContactsForCompany(
    $companyUuid: String!
    $page: Int
    $limit: Int
    $populateCompany: Boolean
  ) {
    hireSignal {
      connectraContactsForCompany(
        companyUuid: $companyUuid
        page: $page
        limit: $limit
        populateCompany: $populateCompany
      )
    }
  }
`;

const HIRE_SIGNAL_EXPORT_SELECTED = gql`
  mutation HireSignalExportSelected($linkedinJobIds: [String!]!) {
    hireSignal {
      exportSelectedJobs(linkedinJobIds: $linkedinJobIds) {
        id
        jobId
        userId
        jobType
        status
        sourceService
        jobFamily
        jobSubtype
        statusPayload
        createdAt
        updatedAt
      }
    }
  }
`;

const HIRE_SIGNAL_EXPORT_JOB_STATUS = gql`
  query HireSignalExportJobStatus($exportJobId: String!) {
    hireSignal {
      exportJobStatus(exportJobId: $exportJobId) {
        id
        jobId
        status
        jobType
        sourceService
        jobFamily
        jobSubtype
        statusPayload
        updatedAt
      }
    }
  }
`;

const HIRE_SIGNAL_EXPORT_DOWNLOAD_URL = gql`
  query HireSignalExportDownloadUrl($exportJobId: String!, $expiresIn: Int) {
    hireSignal {
      exportDownloadUrl(exportJobId: $exportJobId, expiresIn: $expiresIn) {
        downloadUrl
        expiresIn
      }
    }
  }
`;

export type HireSignalExportSchedulerJob = {
  id: string;
  jobId: string;
  userId: string;
  jobType: string;
  status: string;
  sourceService: string;
  jobFamily: string;
  jobSubtype: string | null;
  statusPayload?: unknown | null;
  createdAt: string;
  updatedAt: string | null;
};

export type HireSignalExportDownloadUrlResponse = {
  downloadUrl: string;
  expiresIn: number;
} | null;

/** job.server `sort_field` / `sort_order` (Mongo BSON names). */
export type JobListSortKey =
  | "posted_at"
  | "title"
  | "company_name"
  | "location"
  | "employment_type";

export type JobListSortOrder = "asc" | "desc";

/** Default hiring-signals list: newest `posted_at` first (job.server + DataGrid). */
export const DEFAULT_JOB_SORT_KEY: JobListSortKey = "posted_at";
export const DEFAULT_JOB_SORT_ORDER: JobListSortOrder = "desc";

/** Merge persisted filters with legacy `listSort` (saved searches). */
export function coerceJobListSortFields(
  f: Partial<JobListFilters> & { listSort?: "recent" | "oldest" },
): { sortKey: JobListSortKey; sortOrder: JobListSortOrder } {
  if (!f.sortKey && f.listSort === "oldest") {
    return { sortKey: DEFAULT_JOB_SORT_KEY, sortOrder: "asc" };
  }
  return {
    sortKey: f.sortKey ?? DEFAULT_JOB_SORT_KEY,
    sortOrder: f.sortOrder ?? DEFAULT_JOB_SORT_ORDER,
  };
}

export interface JobListFilters {
  /** Substring tokens, OR within field (matches job.server + gateway). */
  titles?: string[];
  companies?: string[];
  locations?: string[];
  employmentType?: string;
  /** When set, overrides employmentType as repeated job.server params. */
  employmentTypes?: string[];
  seniority?: string;
  functionCategory?: string;
  /** ISO date YYYY-MM-DD or RFC3339 */
  postedAfter?: string;
  postedBefore?: string;
  /** Apify / job.server run id (gateway must expose `jobs(runId:)`). */
  runId?: string;
  /** Toolbar global search — each token matches title OR company OR location (AND across tokens). */
  globalSearchTokens?: string[];
  workplaceTypes?: string[];
  industries?: string[];
  excludedIndustries?: string[];
  excludedTitles?: string[];
  excludedCompanies?: string[];
  excludedLocations?: string[];
  salaryMin?: number;
  salaryMax?: number;
  experienceBuckets?: string[];
  roleTracks?: string[];
  educationLevelMins?: string[];
  clearanceMode?: "" | "allow" | "hide" | "only";
  h1bOnly?: boolean;
  skillsAll?: string[];
  /** Hide jobs the user marked applied (gateway-owned list). */
  hideApplied?: boolean;
  /** Country codes / substrings (OR) — extendedJobFilters.countries → job.server country[]. */
  countries?: string[];
  /** Substring match on apply_method (e.g. SimpleOnsiteApply). */
  applyMethod?: string;
  /** Column sort — extendedJobFilters.sortField / sortOrder → job.server query params. */
  sortKey?: JobListSortKey;
  sortOrder?: JobListSortOrder;
  /** Explicit company UUID list (small lists only; prefer firmographic bucket fields). */
  companyUuids?: string[];
  /** Explicit excluded company UUIDs (small lists only). */
  excludedCompanyUuids?: string[];
  /** Firmographic cohort bucket ids — resolved on job.server (no long URLs). */
  companyEmployeeSizes?: string[];
  excludedCompanyEmployeeSizes?: string[];
  companyFunding?: string[];
  excludedCompanyFunding?: string[];
  companyRevenue?: string[];
  excludedCompanyRevenue?: string[];
  companyCountries?: string[];
  excludedCompanyCountries?: string[];
  companyIndustries?: string[];
  excludedCompanyIndustries?: string[];
  /** Data quality — companies missing website (Connectra). */
  companyMissingWebsite?: boolean;
  /** Data quality — companies missing annual_revenue or zero. */
  companyMissingRevenue?: boolean;
  /** Data quality — C-Suite contacts under this count per company (0 = none). */
  companyCsuiteContactMinCount?: number;
  /** Data quality — HR contacts under this count per company (0 = none). */
  companyHrContactMinCount?: number;
  limit: number;
  offset: number;
}

export type HireSignalJobFilterOptionRow = {
  value: string;
  count: number;
  /** Connectra facet label when not a raw numeric funding token. */
  displayValue?: string;
};

/** Format OS/Connectra total_funding token for dropdown labels when numeric. */
export function formatCompanyFundingLabel(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return t;
  if (n >= 1_000_000_000) {
    const v = n / 1_000_000_000;
    return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}B`;
  }
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return `$${n.toLocaleString("en-US")}`;
}

function buildExtendedJobFilters(
  filters: JobListFilters,
): Record<string, unknown> | null {
  const x: Record<string, unknown> = {};
  if (filters.workplaceTypes?.length) {
    x.workplaceTypes = filters.workplaceTypes;
  }
  const emp =
    filters.employmentTypes?.length && filters.employmentTypes.length > 0
      ? filters.employmentTypes
      : filters.employmentType?.trim()
        ? [filters.employmentType.trim()]
        : undefined;
  if (emp?.length) x.employmentTypes = emp;
  if (filters.industries?.length) {
    x.industries = filters.industries
      .map((s) => String(s).trim())
      .filter(Boolean);
  }
  if (filters.excludedIndustries?.length) {
    x.excludedIndustries = filters.excludedIndustries
      .map((s) => String(s).trim())
      .filter(Boolean);
  }
  if (filters.companyIndustries?.length) {
    x.companyIndustries = filters.companyIndustries
      .map((s) => String(s).trim())
      .filter(Boolean);
  }
  if (filters.excludedCompanyIndustries?.length) {
    x.excludedCompanyIndustries = filters.excludedCompanyIndustries
      .map((s) => String(s).trim())
      .filter(Boolean);
  }
  if (filters.excludedTitles?.length) x.excludedTitles = filters.excludedTitles;
  if (filters.excludedCompanies?.length)
    x.excludedCompanies = filters.excludedCompanies;
  if (filters.excludedLocations?.length)
    x.excludedLocations = filters.excludedLocations;
  if (filters.salaryMin != null && filters.salaryMin > 0) {
    x.salaryMin = Math.floor(filters.salaryMin);
  }
  if (filters.salaryMax != null && filters.salaryMax > 0) {
    x.salaryMax = Math.floor(filters.salaryMax);
  }
  if (filters.experienceBuckets?.length)
    x.experienceBuckets = filters.experienceBuckets;
  if (filters.roleTracks?.length) x.roleTracks = filters.roleTracks;
  if (filters.educationLevelMins?.length)
    x.educationLevelMins = filters.educationLevelMins;
  if (filters.clearanceMode && filters.clearanceMode !== "allow") {
    x.clearanceMode = filters.clearanceMode;
  }
  if (filters.h1bOnly) x.h1bOnly = true;
  if (filters.skillsAll?.length) x.skillsAll = filters.skillsAll;
  if (filters.countries?.length) x.countries = filters.countries;
  if (filters.applyMethod?.trim()) x.applyMethod = filters.applyMethod.trim();
  const { sortKey, sortOrder } = coerceJobListSortFields(
    filters as JobListFilters & { listSort?: "recent" | "oldest" },
  );
  // Always send explicit sort so gateways/job.server never rely on ambiguous defaults.
  x.sortField = sortKey;
  x.sortOrder = sortOrder === "asc" ? "asc" : "desc";
  if (filters.excludedCompanyUuids?.length) {
    x.excludedCompanyUuids = filters.excludedCompanyUuids;
  }
  if (filters.companyEmployeeSizes?.length) {
    x.companyEmployeeSizes = filters.companyEmployeeSizes;
  }
  if (filters.excludedCompanyEmployeeSizes?.length) {
    x.excludedCompanyEmployeeSizes = filters.excludedCompanyEmployeeSizes;
  }
  if (filters.companyFunding?.length) {
    x.companyFunding = filters.companyFunding;
  }
  if (filters.excludedCompanyFunding?.length) {
    x.excludedCompanyFunding = filters.excludedCompanyFunding;
  }
  if (filters.companyRevenue?.length) {
    x.companyRevenue = filters.companyRevenue;
  }
  if (filters.excludedCompanyRevenue?.length) {
    x.excludedCompanyRevenue = filters.excludedCompanyRevenue;
  }
  if (filters.companyCountries?.length) {
    x.companyCountries = filters.companyCountries;
  }
  if (filters.excludedCompanyCountries?.length) {
    x.excludedCompanyCountries = filters.excludedCompanyCountries;
  }
  // companyIndustries → include_cohort_industry (Connectra company industry), not job posting text.
  if (filters.companyMissingWebsite) {
    x.companyMissingWebsite = true;
  }
  if (filters.companyMissingRevenue) {
    x.companyMissingRevenue = true;
  }
  if (
    filters.companyCsuiteContactMinCount != null &&
    filters.companyCsuiteContactMinCount >= 0
  ) {
    x.companyCsuiteContactMinCount = Math.floor(
      filters.companyCsuiteContactMinCount,
    );
  }
  if (
    filters.companyHrContactMinCount != null &&
    filters.companyHrContactMinCount >= 0
  ) {
    x.companyHrContactMinCount = Math.floor(filters.companyHrContactMinCount);
  }
  return Object.keys(x).length > 0 ? x : null;
}

/** Firmographic facet field — exclude same dimension from option-count base filters. */
export type HireSignalFirmographicFacetDimension =
  | "employeeSize"
  | "funding"
  | "revenue"
  | "country"
  | "industry";

const HIRE_SIGNAL_FIRMOGRAPHIC_FILTER_KEYS = [
  "companyEmployeeSizes",
  "excludedCompanyEmployeeSizes",
  "companyFunding",
  "excludedCompanyFunding",
  "companyRevenue",
  "excludedCompanyRevenue",
  "companyCountries",
  "excludedCompanyCountries",
  "companyIndustries",
  "excludedCompanyIndustries",
] as const;

const HIRE_SIGNAL_DATA_QUALITY_FILTER_KEYS = [
  "companyMissingWebsite",
  "companyMissingRevenue",
  "companyCsuiteContactMinCount",
  "companyHrContactMinCount",
] as const;

const FIRMOGRAPHIC_DIMENSION_KEYS: Record<
  HireSignalFirmographicFacetDimension,
  readonly (typeof HIRE_SIGNAL_FIRMOGRAPHIC_FILTER_KEYS)[number][]
> = {
  employeeSize: ["companyEmployeeSizes", "excludedCompanyEmployeeSizes"],
  funding: ["companyFunding", "excludedCompanyFunding"],
  revenue: ["companyRevenue", "excludedCompanyRevenue"],
  country: ["companyCountries", "excludedCompanyCountries"],
  industry: ["companyIndustries", "excludedCompanyIndustries"],
};

/** Remove one firmographic dimension so facet counts show "switch to this bucket" totals. */
export function omitFirmographicDimensionFromJobListFilters(
  base: JobListFilters,
  dimension: HireSignalFirmographicFacetDimension,
): JobListFilters {
  const out = { ...base } as JobListFilters;
  for (const key of FIRMOGRAPHIC_DIMENSION_KEYS[dimension]) {
    out[key] = undefined;
  }
  return out;
}

/** Clears all firmographic bucket fields (used before re-applying from draft). */
export function clearFirmographicJobListFilterFields(
  base: JobListFilters,
): JobListFilters {
  const cleared = { ...base } as JobListFilters;
  for (const key of HIRE_SIGNAL_FIRMOGRAPHIC_FILTER_KEYS) {
    cleared[key] = undefined;
  }
  for (const key of HIRE_SIGNAL_DATA_QUALITY_FILTER_KEYS) {
    cleared[key] = undefined;
  }
  return cleared;
}

export type HireSignalFirmographicDraftOptions = {
  /** Data quality filters are super-admin only in the hiring-signals UI. */
  includeDataQuality?: boolean;
};

/** Draft is source of truth for firmographics — clears stale values on `base` first. */
export function applyFirmographicFiltersFromDraft(
  base: JobListFilters,
  draft: import("@/components/feature/hiring-signals/hiringSignalFilterDraft").HiringSignalFilterDraft,
  options?: HireSignalFirmographicDraftOptions,
): JobListFilters {
  const includeDataQuality = options?.includeDataQuality !== false;
  return {
    ...clearFirmographicJobListFilterFields(base),
    ...hireSignalFirmographicListFiltersFromDraft(draft),
    ...(includeDataQuality
      ? hireSignalDataQualityListFiltersFromDraft(draft)
      : {}),
  };
}

/** Stable key for refetch when firmographic / data-quality draft tokens change. */
export function hireSignalFirmographicDraftKey(
  draft: import("@/components/feature/hiring-signals/hiringSignalFilterDraft").HiringSignalFilterDraft,
  options?: HireSignalFirmographicDraftOptions,
): string {
  const includeDataQuality = options?.includeDataQuality !== false;
  const f = {
    ...hireSignalFirmographicListFiltersFromDraft(draft),
    ...(includeDataQuality
      ? hireSignalDataQualityListFiltersFromDraft(draft)
      : {}),
  };
  return JSON.stringify(f);
}

/** Firmographic filters from draft for job list / facet scoping (server-side UUID resolve). */
export function hireSignalFirmographicListFiltersFromDraft(
  draft: import("@/components/feature/hiring-signals/hiringSignalFilterDraft").HiringSignalFilterDraft,
): Pick<
  JobListFilters,
  | "companyEmployeeSizes"
  | "excludedCompanyEmployeeSizes"
  | "companyFunding"
  | "excludedCompanyFunding"
  | "companyRevenue"
  | "excludedCompanyRevenue"
  | "companyCountries"
  | "excludedCompanyCountries"
  | "companyIndustries"
  | "excludedCompanyIndustries"
> {
  const trim = (xs: string[]) =>
    xs.map((n) => String(n).trim()).filter(Boolean);
  const out: Pick<
    JobListFilters,
    | "companyEmployeeSizes"
    | "excludedCompanyEmployeeSizes"
    | "companyFunding"
    | "excludedCompanyFunding"
    | "companyRevenue"
    | "excludedCompanyRevenue"
    | "companyCountries"
    | "excludedCompanyCountries"
    | "companyIndustries"
    | "excludedCompanyIndustries"
  > = {};
  const es = trim(draft.companyEmployeeSizes);
  if (es.length) out.companyEmployeeSizes = es;
  const exEs = trim(draft.excludedCompanyEmployeeSizes);
  if (exEs.length) out.excludedCompanyEmployeeSizes = exEs;
  const fund = trim(draft.companyFunding);
  if (fund.length) out.companyFunding = fund;
  const exFund = trim(draft.excludedCompanyFunding);
  if (exFund.length) out.excludedCompanyFunding = exFund;
  const rev = trim(draft.companyRevenue);
  if (rev.length) out.companyRevenue = rev;
  const exRev = trim(draft.excludedCompanyRevenue);
  if (exRev.length) out.excludedCompanyRevenue = exRev;
  const co = trim(draft.companyCountries);
  if (co.length) out.companyCountries = co;
  const exCo = trim(draft.excludedCompanyCountries);
  if (exCo.length) out.excludedCompanyCountries = exCo;
  const ind = trim(draft.companyIndustries);
  if (ind.length) out.companyIndustries = ind;
  const exInd = trim(draft.excludedCompanyIndustries);
  if (exInd.length) out.excludedCompanyIndustries = exInd;
  return out;
}

/** Data quality filters from draft for job list (server resolves company UUIDs). */
export function hireSignalDataQualityListFiltersFromDraft(
  draft: import("@/components/feature/hiring-signals/hiringSignalFilterDraft").HiringSignalFilterDraft,
): Pick<
  JobListFilters,
  | "companyMissingWebsite"
  | "companyMissingRevenue"
  | "companyCsuiteContactMinCount"
  | "companyHrContactMinCount"
> {
  const out: Pick<
    JobListFilters,
    | "companyMissingWebsite"
    | "companyMissingRevenue"
    | "companyCsuiteContactMinCount"
    | "companyHrContactMinCount"
  > = {};
  if (draft.companyMissingWebsite) {
    out.companyMissingWebsite = true;
  }
  if (draft.companyMissingRevenue) {
    out.companyMissingRevenue = true;
  }
  const csuite = draft.companyCsuiteContactMinCount;
  if (csuite != null && Number.isFinite(csuite) && csuite >= 0) {
    out.companyCsuiteContactMinCount = Math.floor(csuite);
  }
  const hr = draft.companyHrContactMinCount;
  if (hr != null && Number.isFinite(hr) && hr >= 0) {
    out.companyHrContactMinCount = Math.floor(hr);
  }
  return out;
}

function hireSignalJobListFilterVars(filters: JobListFilters) {
  const ext = buildExtendedJobFilters(filters);
  return {
    titles: filters.titles?.length ? filters.titles : null,
    companies: filters.companies?.length ? filters.companies : null,
    locations: filters.locations?.length ? filters.locations : null,
    employmentType:
      filters.employmentTypes?.length || !filters.employmentType?.trim()
        ? null
        : filters.employmentType,
    seniority: filters.seniority || null,
    functionCategory: filters.functionCategory || null,
    postedAfter: filters.postedAfter || null,
    postedBefore: filters.postedBefore || null,
    runId: filters.runId?.trim() || null,
    extendedJobFilters: ext,
    hideApplied: filters.hideApplied ?? false,
    companyUuids:
      filters.companyUuids?.length && filters.companyUuids.length > 0
        ? filters.companyUuids
        : null,
    searchTokens:
      filters.globalSearchTokens?.length &&
      filters.globalSearchTokens.length > 0
        ? filters.globalSearchTokens
        : null,
  };
}

export function parseJobFilterOptionsPayload(
  raw: HireSignalApiJson,
): HireSignalJobFilterOptionRow[] {
  const env = asRecord(raw);
  const data = env?.data;
  if (!Array.isArray(data)) return [];
  const out: HireSignalJobFilterOptionRow[] = [];
  for (const item of data) {
    const o = asRecord(item);
    if (!o) continue;
    const value = String(o.value ?? "").trim();
    if (!value) continue;
    const c = o.count;
    const count = typeof c === "number" ? c : Number(c) || 0;
    out.push({ value, count });
  }
  return out;
}

export async function fetchHiringSignalJobs(filters: JobListFilters) {
  const limit = Math.max(1, Math.floor(Number(filters.limit) || 50));
  const offset = Math.max(0, Math.floor(Number(filters.offset) || 0));
  const gqlVars = {
    limit,
    offset,
    ...hireSignalJobListFilterVars(filters),
  };
  const queryResult = await graphqlQuery<{
    hireSignal: { jobs: HireSignalApiJson };
  }>(
    HIRE_SIGNAL_JOBS,
    gqlVars,
    // No localStorage TTL: paging must always reflect the requested offset; SWR cache
    // made "next page" look stuck when combined with loading only on empty rows.
    { ...HS_GQL, cacheTtlMs: 0 },
  );
  // #region agent log
  {
    const jobsRaw = queryResult.hireSignal?.jobs;
    const env = asRecord(jobsRaw);
    fetch("http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "78fe0b",
      },
      body: JSON.stringify({
        sessionId: "78fe0b",
        hypothesisId: "A,C,D",
        location: "hiringSignalService.ts:fetchHiringSignalJobs",
        message: "hire signal jobs response",
        data: {
          extendedJobFilters: gqlVars.extendedJobFilters,
          titles: gqlVars.titles,
          total: env?.total,
          success: env?.success,
          dataLen: Array.isArray(env?.data) ? env.data.length : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion
  return queryResult;
}

export async function fetchHireSignalJobFilterOptions(
  field:
    | "title"
    | "company"
    | "location"
    | "company_funding"
    | "company_country"
    | "company_industry"
    | "company_employee_size"
    | "company_revenue",
  filters: JobListFilters,
  options?: { q?: string; limit?: number; offset?: number },
) {
  const res = await graphqlQuery<{
    hireSignal: { jobFilterOptions: HireSignalApiJson };
  }>(
    HIRE_SIGNAL_JOB_FILTER_OPTIONS,
    {
      field,
      q: options?.q?.trim() || null,
      optionLimit: options?.limit ?? 50,
      optionOffset: options?.offset ?? 0,
      ...hireSignalJobListFilterVars(filters),
    },
    { ...HS_GQL, cacheTtlMs: 120_000 },
  );
  return parseJobFilterOptionsPayload(res.hireSignal?.jobFilterOptions);
}

function isStaleCompanyCohortFieldError(
  err: unknown,
  field:
    | "company_funding"
    | "company_country"
    | "company_industry"
    | "company_employee_size"
    | "company_revenue",
): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("field must be one of") &&
    msg.includes("title") &&
    msg.includes("company") &&
    msg.includes("location") &&
    !msg.includes(field)
  );
}

/** Funding facet options via `hireSignal.jobFilterOptions` (job.server; API may fall back to Connectra). */
export async function fetchHireSignalCompanyFundingFilterOptions(
  filters: JobListFilters,
  options?: { q?: string; limit?: number; offset?: number },
): Promise<HireSignalJobFilterOptionRow[]> {
  try {
    return await fetchHireSignalJobFilterOptions(
      "company_funding",
      filters,
      options,
    );
  } catch (err) {
    if (isStaleCompanyCohortFieldError(err, "company_funding")) {
      throw new Error(
        "Funding filter requires a restarted GraphQL API (company_funding). " +
          "Restart contact360.io/api, then rebuild job.server for job counts in brackets.",
      );
    }
    throw err;
  }
}

/** Company country facet options via `hireSignal.jobFilterOptions` (job.server; API may fall back to Connectra). */
export async function fetchHireSignalCompanyCountryFilterOptions(
  filters: JobListFilters,
  options?: { q?: string; limit?: number; offset?: number },
): Promise<HireSignalJobFilterOptionRow[]> {
  try {
    return await fetchHireSignalJobFilterOptions(
      "company_country",
      filters,
      options,
    );
  } catch (err) {
    if (isStaleCompanyCohortFieldError(err, "company_country")) {
      throw new Error(
        "Country filter requires a restarted GraphQL API (company_country). " +
          "Restart contact360.io/api, then rebuild job.server for job counts in brackets.",
      );
    }
    throw err;
  }
}

/** Company industry facet options via `hireSignal.jobFilterOptions` (job.server; API may fall back to Connectra). */
export async function fetchHireSignalCompanyIndustryFilterOptions(
  filters: JobListFilters,
  options?: { q?: string; limit?: number; offset?: number },
): Promise<HireSignalJobFilterOptionRow[]> {
  try {
    return await fetchHireSignalJobFilterOptions(
      "company_industry",
      filters,
      options,
    );
  } catch (err) {
    if (isStaleCompanyCohortFieldError(err, "company_industry")) {
      throw new Error(
        "Industry filter requires a restarted GraphQL API (company_industry). " +
          "Restart contact360.io/api, then rebuild job.server for job counts in brackets.",
      );
    }
    throw err;
  }
}

/** Employee-size bucket facet options via `hireSignal.jobFilterOptions` (job.server). */
export async function fetchHireSignalCompanyEmployeeSizeFilterOptions(
  filters: JobListFilters,
  options?: { q?: string; limit?: number; offset?: number },
): Promise<HireSignalJobFilterOptionRow[]> {
  try {
    return await fetchHireSignalJobFilterOptions(
      "company_employee_size",
      filters,
      options,
    );
  } catch (err) {
    if (isStaleCompanyCohortFieldError(err, "company_employee_size")) {
      throw new Error(
        "Employee size filter requires a restarted GraphQL API (company_employee_size). " +
          "Restart contact360.io/api, then rebuild job.server for job counts in brackets.",
      );
    }
    throw err;
  }
}

/** Revenue bucket facet options via `hireSignal.jobFilterOptions` (job.server). */
export async function fetchHireSignalCompanyRevenueFilterOptions(
  filters: JobListFilters,
  options?: { q?: string; limit?: number; offset?: number },
): Promise<HireSignalJobFilterOptionRow[]> {
  try {
    return await fetchHireSignalJobFilterOptions(
      "company_revenue",
      filters,
      options,
    );
  } catch (err) {
    if (isStaleCompanyCohortFieldError(err, "company_revenue")) {
      throw new Error(
        "Revenue filter requires a restarted GraphQL API (company_revenue). " +
          "Restart contact360.io/api, then rebuild job.server for job counts in brackets.",
      );
    }
    throw err;
  }
}

/** Firmographic-only subset of filter draft (legacy cohort callers). */
export function hireSignalFirmographicCohortFiltersFromDraft(
  draft: import("@/components/feature/hiring-signals/hiringSignalFilterDraft").HiringSignalFilterDraft,
): Record<string, string[]> {
  const scope = hireSignalCompanyScopeFiltersFromDraft(draft);
  return {
    companyFunding: (scope.companyFunding as string[]) ?? [],
    excludedCompanyFunding: (scope.excludedCompanyFunding as string[]) ?? [],
    companyCountries: (scope.companyCountries as string[]) ?? [],
    excludedCompanyCountries:
      (scope.excludedCompanyCountries as string[]) ?? [],
    companyIndustries: (scope.companyIndustries as string[]) ?? [],
    excludedCompanyIndustries:
      (scope.excludedCompanyIndustries as string[]) ?? [],
    companyEmployeeSizes: (scope.companyEmployeeSizes as string[]) ?? [],
    excludedCompanyEmployeeSizes:
      (scope.excludedCompanyEmployeeSizes as string[]) ?? [],
    companyRevenue: (scope.companyRevenue as string[]) ?? [],
    excludedCompanyRevenue: (scope.excludedCompanyRevenue as string[]) ?? [],
  };
}

/** Full company scope for cohort UUID resolution (matches GET /jobs OpenSearch filters). */
export function hireSignalCompanyScopeFiltersFromDraft(
  draft: import("@/components/feature/hiring-signals/hiringSignalFilterDraft").HiringSignalFilterDraft,
  options?: HireSignalFirmographicDraftOptions,
): Record<string, unknown> {
  const firmographic = hireSignalFirmographicListFiltersFromDraft(draft);
  const includeDataQuality = options?.includeDataQuality !== false;
  const dataQuality = includeDataQuality
    ? hireSignalDataQualityListFiltersFromDraft(draft)
    : {};
  return {
    companyFunding: firmographic.companyFunding ?? [],
    excludedCompanyFunding: firmographic.excludedCompanyFunding ?? [],
    companyCountries: firmographic.companyCountries ?? [],
    excludedCompanyCountries: firmographic.excludedCompanyCountries ?? [],
    companyIndustries: firmographic.companyIndustries ?? [],
    excludedCompanyIndustries: firmographic.excludedCompanyIndustries ?? [],
    companyEmployeeSizes: firmographic.companyEmployeeSizes ?? [],
    excludedCompanyEmployeeSizes:
      firmographic.excludedCompanyEmployeeSizes ?? [],
    companyRevenue: firmographic.companyRevenue ?? [],
    excludedCompanyRevenue: firmographic.excludedCompanyRevenue ?? [],
    companyMissingWebsite: dataQuality.companyMissingWebsite === true,
    companyMissingRevenue: dataQuality.companyMissingRevenue === true,
    companyCsuiteContactMinCount: dataQuality.companyCsuiteContactMinCount,
    companyHrContactMinCount: dataQuality.companyHrContactMinCount,
  };
}

export type HireSignalCompanyCohortResolvePayload = {
  uuids: string[];
  excludedUuids: string[];
  total: number;
  truncated: boolean;
};

export function parseResolveCompanyCohortPayload(
  raw: HireSignalApiJson,
): HireSignalCompanyCohortResolvePayload {
  const r = asRecord(raw);
  const uuids = Array.isArray(r?.uuids)
    ? (r.uuids as unknown[]).map((x) => String(x).trim()).filter(Boolean)
    : [];
  const excludedUuids = Array.isArray(r?.excludedUuids)
    ? (r.excludedUuids as unknown[])
        .map((x) => String(x).trim())
        .filter(Boolean)
    : [];
  const total = typeof r?.total === "number" ? r.total : uuids.length;
  return {
    uuids,
    excludedUuids,
    total,
    truncated: Boolean(r?.truncated),
  };
}

export async function fetchHireSignalResolveCompanyCohortUuids(
  draft: import("@/components/feature/hiring-signals/hiringSignalFilterDraft").HiringSignalFilterDraft,
) {
  const cohortFilters = hireSignalCompanyScopeFiltersFromDraft(draft);
  return graphqlQuery<{
    hireSignal: { resolveCompanyCohortUuids: HireSignalApiJson };
  }>(
    HIRE_SIGNAL_RESOLVE_COMPANY_COHORT,
    { cohortFilters },
    { ...HS_GQL, cacheTtlMs: 0 },
  );
}

export async function fetchHiringSignalStats() {
  return graphqlQuery<{
    hireSignal: { stats: HireSignalApiJson };
  }>(HIRE_SIGNAL_STATS, {}, { ...HS_GQL, cacheTtlMs: 120_000 }); // 2 min
}

export async function fetchHiringSignalDashboardKpis() {
  return graphqlQuery<{
    hireSignal: { dashboardKpis: HireSignalApiJson };
  }>(HIRE_SIGNAL_DASHBOARD_KPIS, {}, { ...HS_GQL, cacheTtlMs: 120_000 }); // 2 min
}

export async function fetchCompanyHiringSignalJobs(
  companyUuid: string,
  limit = 50,
) {
  return graphqlQuery<{
    hireSignal: { companyJobs: HireSignalApiJson };
  }>(
    HIRE_SIGNAL_COMPANY_JOBS,
    {
      companyUuid,
      limit,
    },
    HS_GQL,
  );
}

export async function triggerHireSignalScrape(
  body?: Record<string, unknown> | null,
) {
  return graphqlMutation<{
    hireSignal: { triggerScrape: HireSignalApiJson };
  }>(HIRE_SIGNAL_TRIGGER, { body: body ?? null }, HS_GQL);
}

export type HireSignalScrapeJobRow = {
  id: string;
  userId?: string;
  /** scraper.server status: "pending" | "running" | "done" | "failed" | "cancelled" */
  status?: string;
  runId?: string | null;
  error?: string | null;
  itemCount?: number | null;
  createdAt?: string | null;
  scraperResponse?: Record<string, unknown> | null;
};

export async function triggerHireSignalScrapeAndTrack(
  body?: Record<string, unknown> | null,
) {
  return graphqlMutation<{
    hireSignal: { triggerScrapeAndTrack: HireSignalScrapeJobRow };
  }>(HIRE_SIGNAL_TRIGGER_TRACK, { body: body ?? null }, HS_GQL);
}

export async function fetchHireSignalRuns(limit = 20, offset = 0) {
  return graphqlQuery<{
    hireSignal: { runs: HireSignalApiJson };
  }>(HIRE_SIGNAL_RUNS, { limit, offset: Math.max(0, offset) }, HS_GQL);
}

export async function fetchHireSignalRun(runId: string) {
  return graphqlQuery<{
    hireSignal: { run: HireSignalApiJson };
  }>(HIRE_SIGNAL_RUN, { runId }, HS_GQL);
}

export async function refreshHireSignalRun(runId: string) {
  return graphqlQuery<{
    hireSignal: { refreshHireSignalRun: HireSignalApiJson };
  }>(HIRE_SIGNAL_RUN_REFRESH, { runId }, HS_GQL);
}

export async function cancelHireSignalRun(runId: string) {
  const rid = runId.trim();
  return graphqlMutation<{
    hireSignal: { cancelHireSignalRun: HireSignalApiJson };
  }>(HIRE_SIGNAL_RUN_CANCEL, { runId: rid }, HS_GQL);
}

export async function pauseHireSignalRun(runId: string) {
  const rid = runId.trim();
  return graphqlMutation<{
    hireSignal: { pauseHireSignalRun: HireSignalApiJson };
  }>(HIRE_SIGNAL_RUN_PAUSE, { runId: rid }, HS_GQL);
}

export async function resumeHireSignalRun(runId: string) {
  const rid = runId.trim();
  return graphqlMutation<{
    hireSignal: { resumeHireSignalRun: HireSignalApiJson };
  }>(HIRE_SIGNAL_RUN_RESUME, { runId: rid }, HS_GQL);
}

export async function fetchHireSignalRunMetrics() {
  return graphqlQuery<{
    hireSignal: { hireSignalRunMetrics: HireSignalApiJson };
  }>(HIRE_SIGNAL_RUN_METRICS, {}, HS_GQL);
}

export async function fetchGetScrapeJob(
  scrapeJobId: string,
  pollRun: boolean = true,
) {
  return graphqlQuery<{
    hireSignal: { getScrapeJob: HireSignalApiJson };
  }>(
    HIRE_SIGNAL_GET_SCRAPE_JOB,
    { scrapeJobId: scrapeJobId.trim(), pollRun },
    HS_GQL,
  );
}

export async function fetchListScrapeJobs(limit = 50, offset = 0) {
  return graphqlQuery<{
    hireSignal: { listScrapeJobs: HireSignalApiJson };
  }>(HIRE_SIGNAL_LIST_SCRAPE_JOBS, { limit, offset }, HS_GQL);
}

export async function fetchScrapeJobJobs(
  scrapeJobId: string,
  limit = 500,
  offset = 0,
) {
  return graphqlQuery<{
    hireSignal: { scrapeJobJobs: HireSignalApiJson };
  }>(HIRE_SIGNAL_SCRAPE_JOB_JOBS, { scrapeJobId, limit, offset }, HS_GQL);
}

export async function fetchJobConnectraCompany(linkedinJobId: string) {
  return graphqlQuery<{
    hireSignal: { jobConnectraCompany: HireSignalApiJson };
  }>(HIRE_SIGNAL_JOB_CONNECTRA_COMPANY, { linkedinJobId }, HS_GQL);
}

export async function fetchJobConnectraContacts(
  linkedinJobId: string,
  options?: {
    page?: number;
    limit?: number;
    populateCompany?: boolean;
    includePoster?: boolean;
    title?: string;
    departments?: string[];
  },
) {
  const title = options?.title?.trim() ?? "";
  const departments =
    options?.departments?.map((d) => d.trim()).filter(Boolean) ?? [];
  return graphqlQuery<{
    hireSignal: { jobConnectraContacts: HireSignalApiJson };
  }>(
    HIRE_SIGNAL_JOB_CONNECTRA_CONTACTS,
    {
      linkedinJobId,
      page: options?.page ?? 1,
      limit: options?.limit ?? 25,
      populateCompany: options?.populateCompany ?? true,
      includePoster: options?.includePoster ?? true,
      title: title || null,
      departments: departments.length > 0 ? departments : null,
    },
    HS_GQL,
  );
}

export async function fetchConnectraCompany(companyUuid: string) {
  return graphqlQuery<{
    hireSignal: { connectraCompany: HireSignalApiJson };
  }>(HIRE_SIGNAL_CONNECTRA_COMPANY, { companyUuid }, HS_GQL);
}

export async function fetchConnectraContactsForCompany(
  companyUuid: string,
  options?: { page?: number; limit?: number; populateCompany?: boolean },
) {
  return graphqlQuery<{
    hireSignal: { connectraContactsForCompany: HireSignalApiJson };
  }>(
    HIRE_SIGNAL_CONNECTRA_CONTACTS_FOR_COMPANY,
    {
      companyUuid,
      page: options?.page ?? 1,
      limit: options?.limit ?? 25,
      populateCompany: options?.populateCompany ?? true,
    },
    HS_GQL,
  );
}

function linkedinJobIdFromItem(item: unknown): string {
  const o = asRecord(item);
  if (!o) return "";
  return String(o.linkedinJobId ?? o.linkedin_job_id ?? "").trim();
}

/** Batch size when paging through jobs for export ID collection. */
export const HS_EXPORT_FETCH_BATCH = 150;

/** Max LinkedIn job IDs per XLSX export for non-staff (free + paid plans). */
export const HS_EXPORT_MAX_IDS_NON_STAFF = 400;
/**
 * Staff (Admin / SuperAdmin) export cap — large enough to be unlimited in practice.
 * Keep in sync with API `MAX_EXPORT_LINKEDIN_JOB_IDS_STAFF`.
 */
export const HS_EXPORT_MAX_IDS_STAFF = 10_000_000;
/** @deprecated Prefer HS_EXPORT_MAX_IDS_*; legacy default used by older call sites. */
export const HS_MAX_EXPORT_LINKEDIN_IDS = HS_EXPORT_MAX_IDS_STAFF;

/**
 * Collect up to `n` LinkedIn job IDs in list order for the given filters (paged fetch).
 */
export async function fetchLinkedinJobIdsFirstN(
  filters: JobListFilters,
  n: number,
): Promise<string[]> {
  const cap = Math.max(0, Math.floor(n));
  if (cap === 0) return [];

  const ids: string[] = [];
  let offset = 0;

  while (ids.length < cap) {
    const pageSize = Math.min(HS_EXPORT_FETCH_BATCH, cap - ids.length);
    const res = await fetchHiringSignalJobs({
      ...filters,
      limit: pageSize,
      offset,
    });
    const env = hireSignalJobsListFromJson(res.hireSignal?.jobs);
    if (env.data.length === 0) break;

    for (const item of env.data) {
      const id = linkedinJobIdFromItem(item);
      if (id) ids.push(id);
      if (ids.length >= cap) return ids.slice(0, cap);
    }

    if (offset + env.data.length >= env.total) break;
    offset += env.data.length;
  }

  return ids.slice(0, cap);
}

export type CollectAllExportIdsResult = {
  ids: string[];
  totalMatching: number;
  truncated: boolean;
};

/**
 * Collect LinkedIn job IDs for all rows matching filters, up to `maxIds`.
 */
export async function fetchLinkedinJobIdsAllMatching(
  filters: JobListFilters,
  maxIds: number = HS_EXPORT_MAX_IDS_NON_STAFF,
): Promise<CollectAllExportIdsResult> {
  const ids: string[] = [];
  const seen = new Set<string>();
  let offset = 0;
  let totalMatching = 0;

  for (;;) {
    const res = await fetchHiringSignalJobs({
      ...filters,
      limit: HS_EXPORT_FETCH_BATCH,
      offset,
    });
    const env = hireSignalJobsListFromJson(res.hireSignal?.jobs);
    totalMatching = env.total;

    for (const item of env.data) {
      const id = linkedinJobIdFromItem(item);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
      if (ids.length >= maxIds) {
        return {
          ids,
          totalMatching,
          truncated: totalMatching > ids.length,
        };
      }
    }

    if (
      env.data.length === 0 ||
      offset + env.data.length >= env.total ||
      ids.length >= totalMatching
    ) {
      break;
    }
    offset += env.data.length;
  }

  return {
    ids,
    totalMatching,
    truncated: false,
  };
}

export async function exportSelectedHireSignalJobs(linkedinJobIds: string[]) {
  return graphqlMutation<{
    hireSignal: { exportSelectedJobs: HireSignalExportSchedulerJob };
  }>(
    HIRE_SIGNAL_EXPORT_SELECTED,
    { linkedinJobIds },
    { showToastOnError: true },
  );
}

export async function fetchHireSignalExportStatus(exportJobId: string) {
  return graphqlQuery<{
    hireSignal: {
      exportJobStatus: HireSignalExportSchedulerJob & {
        statusPayload?: unknown;
      };
    };
  }>(
    HIRE_SIGNAL_EXPORT_JOB_STATUS,
    { exportJobId: exportJobId.trim() },
    HS_GQL,
  );
}

export async function fetchHireSignalExportDownloadUrl(
  exportJobId: string,
  expiresIn?: number,
) {
  return graphqlQuery<{
    hireSignal: { exportDownloadUrl: HireSignalExportDownloadUrlResponse };
  }>(
    HIRE_SIGNAL_EXPORT_DOWNLOAD_URL,
    {
      exportJobId: exportJobId.trim(),
      expiresIn: expiresIn ?? null,
    },
    HS_GQL,
  );
}

export type HireSignalResumeSuggestPayload = {
  version?: number;
  primaryTitleTokens?: string[];
  locationTokens?: string[];
  extendedJobFiltersSuggestion?: Record<string, unknown>;
  rationale?: string;
};

export async function suggestHireSignalFiltersFromResume(
  fileBase64: string,
  fileName?: string,
) {
  return graphqlMutation<{
    hireSignal: {
      suggestHireSignalFiltersFromResumeUpload: HireSignalResumeSuggestPayload;
    };
  }>(
    HIRE_SIGNAL_SUGGEST_RESUME,
    {
      fileBase64,
      fileName: fileName ?? null,
    },
    { showToastOnError: true },
  );
}

const HIRE_SIGNAL_RECORD_APPLIED = gql`
  mutation HireSignalRecordApplied($linkedinJobId: String!) {
    hireSignal {
      recordHireSignalJobApplied(linkedinJobId: $linkedinJobId)
    }
  }
`;

export async function recordHireSignalJobApplied(linkedinJobId: string) {
  return graphqlMutation<{
    hireSignal: { recordHireSignalJobApplied: boolean };
  }>(
    HIRE_SIGNAL_RECORD_APPLIED,
    { linkedinJobId: linkedinJobId.trim() },
    { showToastOnError: false },
  );
}

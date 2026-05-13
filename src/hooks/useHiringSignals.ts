"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  asRecord,
  DEFAULT_JOB_SORT_KEY,
  DEFAULT_JOB_SORT_ORDER,
  fetchHiringSignalDashboardKpis,
  fetchHiringSignalJobs,
  fetchHiringSignalStats,
  hireSignalJobsListFromJson,
  type HireSignalApiJson,
  type JobListFilters,
  type JobListSortKey,
  type JobListSortOrder,
} from "@/services/graphql/hiringSignalService";

/** Upper bound when merging all pages of a filter match in the browser (memory). */
const HIRE_SIGNAL_CLIENT_FETCH_HARD_CAP = 100_000;

/** Parse `postedAt` ISO for stable client-side ordering (ties broken by LinkedIn job id). */
function postedAtSortMs(iso: string): number {
  const t = Date.parse((iso ?? "").trim());
  return Number.isFinite(t) ? t : 0;
}

/**
 * Stable ordering by normalized `postedAt` (UI ISO) for the current page / merged fetch.
 * Aligns the grid with `JobListFilters` when list order from job.server / Mongo does not
 * match displayed dates (e.g. sort on BSON `posted_at` vs client `resolvePostedAtIso`).
 */
function sortJobRowsByPostedAt(
  rows: LinkedInJobRow[],
  order: "asc" | "desc",
): LinkedInJobRow[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const da = postedAtSortMs(a.postedAt);
    const db = postedAtSortMs(b.postedAt);
    if (da !== db) return order === "asc" ? da - db : db - da;
    const ka = (a.linkedinJobId || a.id || "").localeCompare(
      b.linkedinJobId || b.id || "",
    );
    return ka;
  });
  return copy;
}

/** One hiring-signal job row (job.server / Mongo JSON, camelCase + legacy snake_case). */
export type LinkedInJobRow = {
  id: string;
  linkedinJobId: string;
  /** job.server / Apify run id when row is tied to a scrape run. */
  runId: string;
  apifyItemId: string;
  title: string;
  companyName: string;
  companyUuid: string;
  companyLogoUrl: string;
  location: string;
  country: string;
  postedAt: string;
  employmentType: string;
  /** Mongo `function_category_v2` / gateway camelCase. */
  functionCategory: string;
  workplaceTypes?: string[];
  remoteAllowed: string;
  workRemote?: boolean;
  /** Listing / view URL (LinkedIn job page, `link` from job.server, etc.). */
  jobUrl: string;
  /** Direct application URL from job.server `applyUrl` / `apply_url` when different from listing. */
  applyUrl: string;
  descriptionHtml: string;
  seniority: string;
  educationLevelMin?: string;
  experienceBucket?: string;
  standardizedTitle: string;
  industries: string;
  skillTags?: string[];
  benefits?: string[];
  salaryMinUsd?: number | null;
  salaryMaxUsd?: number | null;
  jobState?: string;
  lastSeen?: string;
};

function pickStr(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
}

function pickNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickStrList(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .map((x) => (typeof x === "string" ? x : String(x ?? "")).trim())
    .filter(Boolean);
  return out.length ? out : undefined;
}

function pickBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === 1) return true;
  if (v === "false" || v === 0) return false;
  return undefined;
}

/** Logo URL often lives on Apify-shaped `raw_payload` when Mongo omits `company_logo_url`. */
function extractCompanyLogoFromRawPayload(
  raw: Record<string, unknown> | null,
): string {
  if (!raw) return "";
  const nested =
    asRecord(raw.company) ??
    asRecord(raw.organization) ??
    asRecord(raw.employer);
  const candidates: unknown[] = [
    raw.companyLogo,
    raw.company_logo,
    raw.logo,
    nested?.companyLogo,
    nested?.logo,
    nested?.company_logo,
    nested?.image,
  ];
  for (const c of candidates) {
    const s = pickStr(c).trim();
    if (s) return s;
  }
  return "";
}

/** Prefer real posted time; fall back to ingest/update when job.server omits `postedAt`. */
function resolvePostedAtIso(o: Record<string, unknown>): string {
  const top = pickStr(
    o.posted_at ??
      o.postedAt ??
      o.created_at ??
      o.createdAt ??
      o.listed_at ??
      o.listedAt ??
      o.date_posted ??
      o.datePosted ??
      "",
  ).trim();
  if (top) return top;
  const raw = asRecord(o.raw_payload ?? o.rawPayload);
  if (raw) {
    const fromRaw = pickStr(
      raw.posted_at ??
        raw.postedAt ??
        raw.created_at ??
        raw.createdAt ??
        raw.listedAt ??
        raw.listed_at ??
        "",
    ).trim();
    if (fromRaw) return fromRaw;
  }
  return pickStr(
    o.ingested_at ?? o.ingestedAt ?? o.updated_at ?? o.updatedAt ?? "",
  ).trim();
}

/**
 * Primary title chain aligned with job.server `effectiveHireSignalTitleSortKeyExpr` (before
 * description fallback) so list sort order matches the Title column.
 */
function resolveJobTitleSortPrimary(
  o: Record<string, unknown>,
  rawPayload: Record<string, unknown> | null,
): string {
  const candidates: unknown[] = [
    o.title,
    o.standardized_title ?? o.standardizedTitle,
    o.poster_title ?? o.posterTitle,
    rawPayload?.job_title,
    rawPayload?.jobTitle,
    rawPayload?.title,
    rawPayload?.name,
  ];
  for (const c of candidates) {
    const s = pickStr(c).trim();
    if (s) return s;
  }
  return "";
}

/** Apply / external apply links from raw Apify-style payloads (snake + camel). */
function extractApplyUrlFromRawPayload(raw: Record<string, unknown> | null): string {
  if (!raw) return "";
  const candidates: unknown[] = [
    raw.applyUrl,
    raw.apply_url,
    raw.applyURL,
    raw.easyApplyUrl,
    raw.easy_apply_url,
    raw.externalApplyUrl,
    raw.applicationUrl,
    raw.application_url,
  ];
  for (const c of candidates) {
    const s = pickStr(c).trim();
    if (s) return s;
  }
  return "";
}

/** Normalize a single JSON object from `hireSignal.jobs` / `companyJobs` payloads. */
export function normalizeLinkedInJobRow(raw: unknown): LinkedInJobRow {
  const o = asRecord(raw) ?? {};
  const linkedinJobId = pickStr(
    o.linkedin_job_id ?? o.linkedinJobId ?? o.linkedin_jobId,
  );
  const id = pickStr(o._id ?? o.id ?? linkedinJobId);
  const runId = pickStr(o.run_id ?? o.runId);
  const functionCategory = pickStr(
    o.function_category_v2 ??
      o.functionCategoryV2 ??
      o.function_category ??
      o.functionCategory,
  );
  const jobStateRaw = pickStr(o.job_state ?? o.jobState);
  const lastSeenRaw = pickStr(o.last_seen_at ?? o.lastSeenAt ?? o.lastSeen);
  const rawPayload = asRecord(o.raw_payload ?? o.rawPayload);
  const companyLogoUrl =
    pickStr(o.company_logo_url ?? o.companyLogoUrl ?? o.company_logo).trim() ||
    extractCompanyLogoFromRawPayload(rawPayload);
  const postedAt = resolvePostedAtIso(o);
  const title =
    resolveJobTitleSortPrimary(o, rawPayload) || pickStr(o.title).trim();
  return {
    id: id || linkedinJobId,
    linkedinJobId: linkedinJobId || id,
    runId,
    apifyItemId: pickStr(o.apify_item_id ?? o.apifyItemId),
    title,
    companyName: pickStr(o.company_name ?? o.companyName),
    companyUuid: pickStr(o.company_uuid ?? o.companyUuid),
    companyLogoUrl,
    location: pickStr(o.location ?? o.formatted_location),
    country: pickStr(o.country ?? o.country_code),
    postedAt,
    employmentType: pickStr(
      o.employment_type ?? o.employmentType ?? o.job_type,
    ),
    functionCategory,
    workplaceTypes: pickStrList(o.workplace_types ?? o.workplaceTypes),
    remoteAllowed: pickStr(o.remote_allowed ?? o.remoteAllowed),
    workRemote: pickBool(o.work_remote ?? o.workRemote),
    jobUrl: pickStr(
      o.job_url ?? o.jobUrl ?? o.url ?? o.link ?? o.job_link ?? o.jobLink,
    ),
    applyUrl: (() => {
      const top = pickStr(o.apply_url ?? o.applyUrl).trim();
      if (top) return top;
      return extractApplyUrlFromRawPayload(rawPayload);
    })(),
    descriptionHtml: pickStr(
      o.description_html ?? o.descriptionHtml ?? o.description,
    ),
    seniority: pickStr(o.seniority ?? o.seniority_level ?? o.seniorityLevel),
    educationLevelMin: pickStr(
      o.education_level_min ?? o.educationLevelMin,
    ).trim()
      ? pickStr(o.education_level_min ?? o.educationLevelMin)
      : undefined,
    experienceBucket: pickStr(o.experience_bucket ?? o.experienceBucket).trim()
      ? pickStr(o.experience_bucket ?? o.experienceBucket)
      : undefined,
    standardizedTitle: pickStr(o.standardized_title ?? o.standardizedTitle),
    industries: pickStr(o.industries ?? o.industry),
    skillTags: pickStrList(o.skill_tags ?? o.skillTags),
    benefits: pickStrList(o.benefits),
    salaryMinUsd: pickNum(o.salary_min_usd ?? o.salaryMinUsd),
    salaryMaxUsd: pickNum(o.salary_max_usd ?? o.salaryMaxUsd),
    jobState: jobStateRaw.trim() ? jobStateRaw : undefined,
    lastSeen: lastSeenRaw.trim() ? lastSeenRaw : undefined,
  };
}

/** Parse `hireSignal.jobs` / `hireSignal.companyJobs` JSON envelope into typed rows. */
export function parseLinkedInJobsPayload(raw: unknown): {
  success: boolean;
  data: LinkedInJobRow[];
  total: number;
} {
  const env = hireSignalJobsListFromJson(raw as HireSignalApiJson);
  const data = env.data.map((row) => normalizeLinkedInJobRow(row));
  return { success: env.success, data, total: env.total };
}

export function effectivePostedAfter(
  preset: "all" | "new_7d",
  explicitPostedAfter: string | undefined,
): string | undefined {
  const trimmed = explicitPostedAfter?.trim();
  if (preset !== "new_7d") {
    return trimmed || undefined;
  }
  if (trimmed) return trimmed;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

function parseStatsPayload(raw: unknown): {
  totalJobs: number;
  jobsWithCompany: number;
} {
  const r = asRecord(raw);
  if (!r) return { totalJobs: 0, jobsWithCompany: 0 };
  const tj = r.total_jobs ?? r.totalJobs ?? r.total;
  const jwc = r.jobs_with_company ?? r.jobsWithCompany ?? r.with_company;
  const totalJobs =
    typeof tj === "number" && Number.isFinite(tj)
      ? Math.max(0, Math.floor(tj))
      : 0;
  const jobsWithCompany =
    typeof jwc === "number" && Number.isFinite(jwc)
      ? Math.max(0, Math.floor(jwc))
      : 0;
  return { totalJobs, jobsWithCompany };
}

function parseDashboardKpisPayload(raw: unknown): {
  jobsWithSalary: number;
  medianSalaryMinUsd?: number;
  remoteCount: number;
  distinctCountries: number;
  distinctCompanies: number;
} {
  const r = asRecord(raw);
  if (!r) {
    return {
      jobsWithSalary: 0,
      remoteCount: 0,
      distinctCountries: 0,
      distinctCompanies: 0,
    };
  }
  const jws = r.jobs_with_salary ?? r.jobsWithSalary;
  const jobsWithSalary =
    typeof jws === "number" && Number.isFinite(jws)
      ? Math.max(0, Math.floor(jws))
      : 0;
  const medRaw = r.median_salary_min_usd ?? r.medianSalaryMinUsd;
  let medianSalaryMinUsd: number | undefined;
  if (typeof medRaw === "number" && Number.isFinite(medRaw)) {
    medianSalaryMinUsd = Math.floor(medRaw);
  }
  const rc = r.remote_count ?? r.remoteCount;
  const remoteCount =
    typeof rc === "number" && Number.isFinite(rc)
      ? Math.max(0, Math.floor(rc))
      : 0;
  const dc = r.distinct_countries ?? r.distinctCountries;
  const distinctCountries =
    typeof dc === "number" && Number.isFinite(dc)
      ? Math.max(0, Math.floor(dc))
      : 0;
  const dco = r.distinct_companies ?? r.distinctCompanies;
  const distinctCompanies =
    typeof dco === "number" && Number.isFinite(dco)
      ? Math.max(0, Math.floor(dco))
      : 0;
  return {
    jobsWithSalary,
    medianSalaryMinUsd,
    remoteCount,
    distinctCountries,
    distinctCompanies,
  };
}

/** Mongo-wide aggregates from job.server (stats + dashboard KPIs). */
export type HiringSignalIndexStats = {
  totalJobs: number;
  jobsWithCompany: number;
  globalJobsWithSalary: number;
  globalMedianSalaryMinUsd?: number;
  globalRemoteCount: number;
  globalDistinctCountries: number;
  globalDistinctCompanies: number;
};

export type UseHiringSignalsOptions = {
  signalTimePreset: "all" | "new_7d";
  /**
   * When true, follow-up pages are fetched until the filtered `total` is loaded
   * (capped) so analytics charts see the full match set, not only the first page.
   */
  fetchFullMatchPages?: boolean;
  /**
   * When false, skips job list + stats network calls (e.g. dashboard for non–hiring-signal roles).
   */
  enabled?: boolean;
};

export type UseHiringSignalsResult = {
  jobs: LinkedInJobRow[];
  total: number;
  loading: boolean;
  statsLoading: boolean;
  error: string | null;
  filters: JobListFilters;
  setFilters: Dispatch<SetStateAction<JobListFilters>>;
  setPage: (zeroBasedPage: number) => void;
  setPageSize: (n: number) => void;
  refetch: () => Promise<void>;
  currentPage: number;
  stats: HiringSignalIndexStats;
  /**
   * When `fetchFullMatchPages` is on and the server reports more matches than loaded
   * (hard cap), this is the cap row count; otherwise null.
   */
  analyticsMatchCappedAt: number | null;
};

/**
 * Paginated hiring-signal job list + global stats for dashboards and hiring-signals UI.
 */
export function useHiringSignals(
  initial: Partial<JobListFilters> = {},
  options: UseHiringSignalsOptions,
): UseHiringSignalsResult {
  const {
    signalTimePreset,
    fetchFullMatchPages = false,
    enabled: enabledOption = true,
  } = options;
  const enabled = enabledOption !== false;

  const [filters, setFilters] = useState<JobListFilters>(() => ({
    ...initial,
    sortKey: initial.sortKey ?? DEFAULT_JOB_SORT_KEY,
    sortOrder: initial.sortOrder ?? DEFAULT_JOB_SORT_ORDER,
    limit: initial.limit ?? 50,
    offset: initial.offset ?? 0,
  }));

  const [jobs, setJobs] = useState<LinkedInJobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [analyticsMatchCappedAt, setAnalyticsMatchCappedAt] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState(() => enabled);
  const [statsLoading, setStatsLoading] = useState(() => enabled);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<HiringSignalIndexStats>({
    totalJobs: 0,
    jobsWithCompany: 0,
    globalJobsWithSalary: 0,
    globalMedianSalaryMinUsd: undefined,
    globalRemoteCount: 0,
    globalDistinctCountries: 0,
    globalDistinctCompanies: 0,
  });

  /** Ignore stale `fetchHiringSignalJobs` results when filters/preset change faster than the network. */
  const hireSignalLoadGenRef = useRef(0);
  /** Sort fields for the last successful `setJobs` — used to drop rows immediately when sort changes (avoids desc header + asc rows until fetch completes). */
  const lastSuccessfulJobListSortRef = useRef<{
    sortKey: JobListSortKey;
    sortOrder: JobListSortOrder;
  } | null>(null);
  /** Latest merged list filters — for `refetch()` only; scheduled loads pass `listFilters` from the effect. */
  const listFiltersRef = useRef<JobListFilters | null>(null);

  const listFilters = useMemo(
    () => ({
      ...filters,
      postedAfter: effectivePostedAfter(signalTimePreset, filters.postedAfter),
    }),
    [filters, signalTimePreset],
  );

  listFiltersRef.current = listFilters;

  const runLoad = useCallback(
    async (filtersToFetch: JobListFilters) => {
      const gen = ++hireSignalLoadGenRef.current;
      const snapshot: JobListFilters = { ...filtersToFetch };
      const snapSortKey = snapshot.sortKey ?? DEFAULT_JOB_SORT_KEY;
      const snapSortOrder: JobListSortOrder =
        snapshot.sortOrder === "asc" ? "asc" : DEFAULT_JOB_SORT_ORDER;
      const prevSort = lastSuccessfulJobListSortRef.current;
      const sortParamsChanged =
        prevSort != null &&
        (prevSort.sortKey !== snapSortKey || prevSort.sortOrder !== snapSortOrder);
      if (sortParamsChanged) {
        setJobs([]);
      }
      setLoading(true);
      setError(null);
      setAnalyticsMatchCappedAt(null);
      try {
        const res = await fetchHiringSignalJobs(snapshot);
        if (gen !== hireSignalLoadGenRef.current) {
          return;
        }
        const parsed = parseLinkedInJobsPayload(res.hireSignal?.jobs);
        if (!parsed.success) {
          setError(
            parsed.data.length > 0
              ? "Job list response was incomplete."
              : "Job list temporarily unavailable. Try Refresh or narrow filters.",
          );
          if (parsed.data.length > 0) {
            const ord: "asc" | "desc" =
              snapSortOrder === "asc" ? "asc" : DEFAULT_JOB_SORT_ORDER;
            let rows = parsed.data;
            if (snapSortKey === "posted_at") {
              rows = sortJobRowsByPostedAt(rows, ord);
            }
            setJobs(rows);
            setTotal(parsed.total);
            lastSuccessfulJobListSortRef.current = {
              sortKey: snapSortKey,
              sortOrder: snapSortOrder,
            };
          }
          return;
        }
        let merged = parsed.data;
        const listTotal = parsed.total;
        if (
          fetchFullMatchPages &&
          listTotal > merged.length &&
          gen === hireSignalLoadGenRef.current
        ) {
          const chunk = Math.min(
            2000,
            Math.max(100, Math.floor(Number(snapshot.limit)) || 1000),
          );
          let off = merged.length;
          while (
            off < listTotal &&
            merged.length < HIRE_SIGNAL_CLIENT_FETCH_HARD_CAP &&
            gen === hireSignalLoadGenRef.current
          ) {
            const pageSnapshot: JobListFilters = {
              ...snapshot,
              offset: off,
              limit: chunk,
            };
            const pageRes = await fetchHiringSignalJobs(pageSnapshot);
            if (gen !== hireSignalLoadGenRef.current) break;
            const pageParsed = parseLinkedInJobsPayload(
              pageRes.hireSignal?.jobs,
            );
            if (!pageParsed.success || pageParsed.data.length === 0) break;
            merged = merged.concat(pageParsed.data);
            off += pageParsed.data.length;
          }
        }
        const hitCap =
          fetchFullMatchPages &&
          listTotal > merged.length &&
          merged.length >= HIRE_SIGNAL_CLIENT_FETCH_HARD_CAP;
        setAnalyticsMatchCappedAt(
          hitCap ? HIRE_SIGNAL_CLIENT_FETCH_HARD_CAP : null,
        );
        const sortKeyEff = snapshot.sortKey ?? DEFAULT_JOB_SORT_KEY;
        const sortOrderEff: "asc" | "desc" =
          snapshot.sortOrder === "asc" ? "asc" : DEFAULT_JOB_SORT_ORDER;
        if (sortKeyEff === "posted_at") {
          merged = sortJobRowsByPostedAt(merged, sortOrderEff);
        }
        setJobs(merged);
        setTotal(listTotal);
        lastSuccessfulJobListSortRef.current = {
          sortKey: sortKeyEff,
          sortOrder: sortOrderEff,
        };
      } catch (e) {
        if (gen !== hireSignalLoadGenRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to load jobs");
        setJobs([]);
        setTotal(0);
        setAnalyticsMatchCappedAt(null);
        lastSuccessfulJobListSortRef.current = null;
      } finally {
        if (gen === hireSignalLoadGenRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchFullMatchPages],
  );

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [st, kp] = await Promise.all([
        fetchHiringSignalStats(),
        fetchHiringSignalDashboardKpis(),
      ]);
      const s = parseStatsPayload(st.hireSignal?.stats);
      const d = parseDashboardKpisPayload(kp.hireSignal?.dashboardKpis);
      setStats({
        totalJobs: s.totalJobs,
        jobsWithCompany: s.jobsWithCompany,
        globalJobsWithSalary: d.jobsWithSalary,
        globalMedianSalaryMinUsd: d.medianSalaryMinUsd,
        globalRemoteCount: d.remoteCount,
        globalDistinctCountries: d.distinctCountries,
        globalDistinctCompanies: d.distinctCompanies,
      });
    } catch {
      setStats({
        totalJobs: 0,
        jobsWithCompany: 0,
        globalJobsWithSalary: 0,
        globalMedianSalaryMinUsd: undefined,
        globalRemoteCount: 0,
        globalDistinctCountries: 0,
        globalDistinctCompanies: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setJobs([]);
      setTotal(0);
      setAnalyticsMatchCappedAt(null);
      setError(null);
      setLoading(false);
      lastSuccessfulJobListSortRef.current = null;
      return;
    }
    void runLoad(listFilters);
  }, [enabled, listFilters, runLoad]);

  useEffect(() => {
    if (!enabled) {
      setStatsLoading(false);
      return;
    }
    void loadStats();
  }, [enabled, loadStats]);

  const setPage = useCallback((zeroBasedPage: number) => {
    setFilters((f) => {
      const lim = Math.max(1, Math.floor(Number(f.limit) || 50));
      const page = Math.max(0, Math.floor(Number(zeroBasedPage) || 0));
      return {
        ...f,
        limit: lim,
        offset: page * lim,
      };
    });
  }, []);

  const setPageSize = useCallback((n: number) => {
    const size = Math.max(1, Math.floor(Number(n) || 50));
    setFilters((f) => ({ ...f, limit: size, offset: 0 }));
  }, []);

  const currentPage =
    filters.limit > 0 ? Math.floor(filters.offset / filters.limit) : 0;

  const refetch = useCallback(async () => {
    if (!enabled) return;
    const f = listFiltersRef.current;
    if (!f) return;
    await Promise.all([runLoad(f), loadStats()]);
  }, [enabled, runLoad, loadStats]);

  return {
    jobs,
    total,
    loading,
    statsLoading,
    error,
    filters,
    setFilters,
    setPage,
    setPageSize,
    refetch,
    currentPage,
    stats,
    analyticsMatchCappedAt,
  };
}

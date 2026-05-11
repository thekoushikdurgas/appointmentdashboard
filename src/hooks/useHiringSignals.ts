"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  asRecord,
  fetchHiringSignalJobs,
  fetchHiringSignalStats,
  hireSignalJobsListFromJson,
  type HireSignalApiJson,
  type JobListFilters,
} from "@/services/graphql/hiringSignalService";

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
  jobUrl: string;
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
  return {
    id: id || linkedinJobId,
    linkedinJobId: linkedinJobId || id,
    runId,
    apifyItemId: pickStr(o.apify_item_id ?? o.apifyItemId),
    title: pickStr(o.title),
    companyName: pickStr(o.company_name ?? o.companyName),
    companyUuid: pickStr(o.company_uuid ?? o.companyUuid),
    companyLogoUrl: pickStr(
      o.company_logo_url ?? o.companyLogoUrl ?? o.company_logo,
    ),
    location: pickStr(o.location ?? o.formatted_location),
    country: pickStr(o.country ?? o.country_code),
    postedAt: pickStr(o.posted_at ?? o.postedAt ?? o.created_at ?? ""),
    employmentType: pickStr(
      o.employment_type ?? o.employmentType ?? o.job_type,
    ),
    functionCategory,
    workplaceTypes: pickStrList(o.workplace_types ?? o.workplaceTypes),
    remoteAllowed: pickStr(o.remote_allowed ?? o.remoteAllowed),
    workRemote: pickBool(o.work_remote ?? o.workRemote),
    jobUrl: pickStr(o.job_url ?? o.jobUrl ?? o.url ?? o.apply_url),
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

export type UseHiringSignalsOptions = {
  signalTimePreset: "all" | "new_7d";
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
  stats: { totalJobs: number; jobsWithCompany: number };
};

/**
 * Paginated hiring-signal job list + global stats for dashboards and hiring-signals UI.
 */
export function useHiringSignals(
  initial: Partial<JobListFilters> = {},
  options: UseHiringSignalsOptions,
): UseHiringSignalsResult {
  const { signalTimePreset } = options;

  const [filters, setFilters] = useState<JobListFilters>(() => ({
    ...initial,
    limit: initial.limit ?? 50,
    offset: initial.offset ?? 0,
  }));

  const [jobs, setJobs] = useState<LinkedInJobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalJobs: number;
    jobsWithCompany: number;
  }>({ totalJobs: 0, jobsWithCompany: 0 });

  const listFilters = useMemo(
    () => ({
      ...filters,
      postedAfter: effectivePostedAfter(signalTimePreset, filters.postedAfter),
    }),
    [filters, signalTimePreset],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHiringSignalJobs(listFilters);
      const parsed = parseLinkedInJobsPayload(res.hireSignal?.jobs);
      setJobs(parsed.data);
      setTotal(parsed.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [listFilters]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetchHiringSignalStats();
      setStats(parseStatsPayload(res.hireSignal?.stats));
    } catch {
      setStats({ totalJobs: 0, jobsWithCompany: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const setPage = useCallback((zeroBasedPage: number) => {
    setFilters((f) => ({
      ...f,
      offset: Math.max(0, zeroBasedPage) * f.limit,
    }));
  }, []);

  const setPageSize = useCallback((n: number) => {
    const size = Math.max(1, Math.floor(n));
    setFilters((f) => ({ ...f, limit: size, offset: 0 }));
  }, []);

  const currentPage =
    filters.limit > 0 ? Math.floor(filters.offset / filters.limit) : 0;

  const refetch = useCallback(async () => {
    await Promise.all([load(), loadStats()]);
  }, [load, loadStats]);

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
  };
}

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import {
  asRecord,
  DEFAULT_JOB_SORT_KEY,
  DEFAULT_JOB_SORT_ORDER,
  fetchHiringSignalDashboardKpis,
  fetchHiringSignalJobs,
  fetchHiringSignalStats,
  applyFirmographicFiltersFromDraft,
  hireSignalFirmographicDraftKey,
  type JobListFilters,
  type JobListSortKey,
  type JobListSortOrder,
} from "@/services/graphql/hiringSignalService";
import {
  effectivePostedAfter,
  parseLinkedInJobsPayload,
  sortJobRowsByPostedAt,
  type LinkedInJobRow,
} from "@/lib/jobs/hiringSignalJobRows";
import type { HiringSignalFilterDraft } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import {
  EMPTY_HIRING_SIGNAL_DRAFT,
  normalizeHiringSignalTokenList,
} from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import { useRole } from "@/context/RoleContext";

function mergeJobListTokens(
  existing: string[] | undefined,
  extra: string[],
): string[] | undefined {
  const merged = normalizeHiringSignalTokenList([
    ...(existing ?? []),
    ...extra,
  ]);
  return merged.length ? merged : undefined;
}

/** Upper bound when merging all pages of a filter match in the browser (memory). */
const HIRE_SIGNAL_CLIENT_FETCH_HARD_CAP = 100_000;

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
  /** Latest hiring-signals filter draft (for OpenSearch company scope / cohort resolution). */
  companyCohortDraftRef?: MutableRefObject<HiringSignalFilterDraft>;
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
  companyCohortResolving: boolean;
  companyCohortMatchTotal: number | null;
  companyCohortTruncated: boolean;
  /** Last resolved company UUID list applied to job list / facet scoping. */
  resolvedCompanyUuids?: string[];
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
    companyCohortDraftRef,
  } = options;
  const cohortDraftRef = companyCohortDraftRef;
  const enabled = enabledOption !== false;
  const { isSuperAdmin } = useRole();
  const firmographicDraftOptions = useMemo(
    () => ({ includeDataQuality: isSuperAdmin }),
    [isSuperAdmin],
  );

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
  const [companyCohortResolving, setCompanyCohortResolving] = useState(false);
  const [companyCohortMatchTotal, setCompanyCohortMatchTotal] = useState<
    number | null
  >(null);
  const [companyCohortTruncated, setCompanyCohortTruncated] = useState(false);
  const [resolvedCompanyUuids, setResolvedCompanyUuids] = useState<
    string[] | undefined
  >(undefined);
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
        (prevSort.sortKey !== snapSortKey ||
          prevSort.sortOrder !== snapSortOrder);
      if (sortParamsChanged) {
        setJobs([]);
      }
      setLoading(true);
      setError(null);
      setAnalyticsMatchCappedAt(null);
      setCompanyCohortMatchTotal(null);
      setCompanyCohortTruncated(false);
      try {
        const draftForCohort =
          cohortDraftRef?.current ?? EMPTY_HIRING_SIGNAL_DRAFT;
        const firmographicKeyAtFetch = hireSignalFirmographicDraftKey(
          draftForCohort,
          firmographicDraftOptions,
        );
        setCompanyCohortResolving(false);
        let fetchSnapshot = applyFirmographicFiltersFromDraft(
          {
            ...snapshot,
            companyUuids: undefined,
            excludedCompanyUuids: undefined,
          },
          draftForCohort,
          firmographicDraftOptions,
        );
        if (gen !== hireSignalLoadGenRef.current) {
          return;
        }

        const includePostingNames = normalizeHiringSignalTokenList(
          draftForCohort.companyNames,
        );
        const excludePostingNames = normalizeHiringSignalTokenList(
          draftForCohort.excludedCompanyNames,
        );

        if (includePostingNames.length > 0) {
          fetchSnapshot = {
            ...fetchSnapshot,
            companies: mergeJobListTokens(
              fetchSnapshot.companies,
              includePostingNames,
            ),
          };
        }
        if (excludePostingNames.length > 0) {
          fetchSnapshot = {
            ...fetchSnapshot,
            excludedCompanies: mergeJobListTokens(
              fetchSnapshot.excludedCompanies,
              excludePostingNames,
            ),
          };
        }

        setResolvedCompanyUuids(undefined);

        // #region agent log
        fetch(
          "http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "78fe0b",
            },
            body: JSON.stringify({
              sessionId: "78fe0b",
              hypothesisId: "A,B,D",
              location: "useHiringSignals.ts:runLoad:pre-fetch",
              message: "hire signal fetch snapshot",
              data: {
                draftCompanyIndustries: draftForCohort.companyIndustries,
                snapshotCompanyIndustries: fetchSnapshot.companyIndustries,
                snapshotIndustries: fetchSnapshot.industries,
                firmographicKey: firmographicKeyAtFetch,
              },
              timestamp: Date.now(),
            }),
          },
        ).catch(() => {});
        // #endregion

        const res = await fetchHiringSignalJobs(fetchSnapshot);
        if (gen !== hireSignalLoadGenRef.current) {
          return;
        }
        const parsed = parseLinkedInJobsPayload(res.hireSignal?.jobs);
        if (gen !== hireSignalLoadGenRef.current) {
          return;
        }
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
          } else {
            setJobs([]);
            setTotal(0);
            lastSuccessfulJobListSortRef.current = null;
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
              ...fetchSnapshot,
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
        if (gen !== hireSignalLoadGenRef.current) {
          return;
        }
        const currentDraft =
          cohortDraftRef?.current ?? EMPTY_HIRING_SIGNAL_DRAFT;
        if (
          hireSignalFirmographicDraftKey(
            currentDraft,
            firmographicDraftOptions,
          ) !== firmographicKeyAtFetch
        ) {
          return;
        }
        setJobs(merged);
        setTotal(listTotal);
        // Empty results with active company filters are valid (facet may already show count 0).
        lastSuccessfulJobListSortRef.current = {
          sortKey: sortKeyEff,
          sortOrder: sortOrderEff,
        };
      } catch (e) {
        if (gen !== hireSignalLoadGenRef.current) return;
        setCompanyCohortResolving(false);
        setError(e instanceof Error ? e.message : "Failed to load jobs");
        setJobs([]);
        setTotal(0);
        setAnalyticsMatchCappedAt(null);
        lastSuccessfulJobListSortRef.current = null;
      } finally {
        if (gen === hireSignalLoadGenRef.current) {
          setCompanyCohortResolving(false);
          setLoading(false);
        }
      }
    },
    [fetchFullMatchPages, cohortDraftRef, firmographicDraftOptions],
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
      setResolvedCompanyUuids(undefined);
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
    companyCohortResolving,
    companyCohortMatchTotal,
    companyCohortTruncated,
    resolvedCompanyUuids,
  };
}

export type { LinkedInJobRow } from "@/lib/jobs/hiringSignalJobRows";
export {
  normalizeLinkedInJobRow,
  parseLinkedInJobsPayload,
  effectivePostedAfter,
} from "@/lib/jobs/hiringSignalJobRows";

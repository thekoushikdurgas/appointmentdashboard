"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchHiringSignalJobs,
  fetchHiringSignalStats,
  hireSignalJobsListFromJson,
  asRecord,
  type HireSignalApiJson,
  type JobListFilters,
} from "@/services/graphql/hiringSignalService";
import { toast } from "sonner";

function sevenDaysAgoYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** When preset is new_7d, ensure postedAfter is at least 7 days ago (stricter user dates win). */
export function effectivePostedAfter(
  preset: "all" | "new_7d",
  fromFilters: string | undefined,
): string | undefined {
  if (preset !== "new_7d") return fromFilters;
  const seven = sevenDaysAgoYmd();
  const u = fromFilters?.trim();
  if (!u) return seven;
  return u > seven ? u : seven;
}

export interface LinkedInJobRow {
  id?: string;
  linkedinJobId: string;
  runId: string;
  apifyItemId: string;
  companyUuid: string;
  companyName: string;
  companyLinkedin: string;
  companyLogoUrl: string;
  companyStaffCount: number;
  title: string;
  descriptionHtml: string;
  postedAt: string;
  jobUrl: string;
  jobState: string;
  remoteAllowed: string;
  employmentType: string;
  seniority: string;
  functionCategory: string;
  industries: string;
  companyDescription: string;
  location: string;
  lastSeen: string;
}

function parseJobListPayload(raw: unknown): {
  success: boolean;
  data: LinkedInJobRow[];
  total: number;
} {
  const envelope = hireSignalJobsListFromJson(raw as HireSignalApiJson);
  return {
    success: envelope.success,
    data: envelope.data.map((item) => mapJobRow(item)),
    total: envelope.total,
  };
}

function mapJobRow(item: unknown): LinkedInJobRow {
  const o = asRecord(item) ?? {};
  return {
    id: typeof o.id === "string" ? o.id : String(o._id ?? ""),
    linkedinJobId: String(o.linkedinJobId ?? o.linkedin_job_id ?? ""),
    runId: String(o.runId ?? o.run_id ?? ""),
    apifyItemId: String(o.apifyItemId ?? o.apify_item_id ?? ""),
    companyUuid: String(o.companyUuid ?? o.company_uuid ?? ""),
    companyName: String(o.companyName ?? o.company_name ?? ""),
    companyLinkedin: String(
      o.companyLinkedinUrl ??
        o.company_linkedin_url ??
        o.company_linkedin ??
        "",
    ),
    companyLogoUrl: String(o.companyLogoUrl ?? o.company_logo_url ?? ""),
    companyStaffCount:
      Number(o.companyStaffCount ?? o.company_staff_count ?? 0) || 0,
    title: String(o.title ?? ""),
    descriptionHtml: String(
      o.descriptionHTML ?? o.descriptionHtml ?? o.description ?? "",
    ),
    postedAt: String(o.postedAt ?? o.posted_at ?? ""),
    jobUrl: String(o.jobUrl ?? o.job_url ?? ""),
    jobState: String(o.jobState ?? o.job_state ?? ""),
    remoteAllowed: String(o.remoteAllowed ?? o.remote_allowed ?? ""),
    employmentType: String(o.employmentType ?? o.employment_type ?? ""),
    seniority: String(o.seniorityLevel ?? o.seniority ?? ""),
    functionCategory: String(
      o.functionCategoryV2 ??
        o.function_category_v2 ??
        o.functionCategory ??
        "",
    ),
    industries: String(o.industries ?? ""),
    companyDescription: String(
      o.companyDescriptionV2 ?? o.company_description_v2 ?? "",
    ),
    location: String(
      o.formattedLocationFull ?? o.location_str ?? o.location ?? "",
    ),
    lastSeen: String(o.lastSeenAt ?? o.last_seen_at ?? o.lastSeen ?? ""),
  };
}

function parseStatsPayload(raw: unknown): {
  success: boolean;
  totalJobs: number;
  jobsWithCompany: number;
} {
  const r = asRecord(raw);
  if (!r) {
    return { success: false, totalJobs: 0, jobsWithCompany: 0 };
  }
  return {
    success: Boolean(r.success),
    totalJobs: Number(r.total_jobs ?? r.totalJobs ?? 0) || 0,
    jobsWithCompany: Number(r.jobs_with_company ?? r.jobsWithCompany ?? 0) || 0,
  };
}

export function useHiringSignals(
  initial: Partial<JobListFilters> = {},
  options?: { signalTimePreset?: "all" | "new_7d" },
) {
  const signalTimePreset = options?.signalTimePreset ?? "all";

  const [filters, setFilters] = useState<JobListFilters>({
    titles: initial.titles,
    companies: initial.companies,
    locations: initial.locations,
    employmentType: initial.employmentType,
    seniority: initial.seniority,
    functionCategory: initial.functionCategory,
    postedAfter: initial.postedAfter,
    postedBefore: initial.postedBefore,
    runId: initial.runId,
    limit: initial.limit ?? 25,
    offset: initial.offset ?? 0,
  });

  const [jobs, setJobs] = useState<LinkedInJobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    success: false,
    totalJobs: 0,
    jobsWithCompany: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const postedAfter = effectivePostedAfter(
        signalTimePreset,
        filters.postedAfter,
      );
      const [jobsRes, statsRes] = await Promise.all([
        fetchHiringSignalJobs({ ...filters, postedAfter }),
        fetchHiringSignalStats(),
      ]);
      const j = parseJobListPayload(jobsRes.hireSignal?.jobs);
      setJobs(j.data);
      setTotal(j.total);
      setStats(parseStatsPayload(statsRes.hireSignal?.stats));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load jobs";
      setError(msg);
      toast.error("Hiring signals", { description: msg });
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [filters, signalTimePreset]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const setPage = useCallback(
    (pageIndex: number) => {
      setFilters((f) => ({
        ...f,
        offset: pageIndex * f.limit,
      }));
    },
    [setFilters],
  );

  const setPageSize = useCallback(
    (limit: number) => {
      setFilters((f) => ({ ...f, limit, offset: 0 }));
    },
    [setFilters],
  );

  const setFilterField = useCallback(
    (key: keyof JobListFilters, value: string | string[] | undefined) => {
      setFilters((f) => ({ ...f, [key]: value, offset: 0 }));
    },
    [],
  );

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / (filters.limit || 1))),
    [total, filters.limit],
  );

  const currentPage = useMemo(
    () => Math.floor(filters.offset / (filters.limit || 1)),
    [filters.offset, filters.limit],
  );

  return {
    jobs,
    total,
    stats,
    loading,
    statsLoading,
    error,
    filters,
    setFilters,
    setPage,
    setPageSize,
    setFilterField,
    refetch,
    pageCount,
    currentPage,
  };
}

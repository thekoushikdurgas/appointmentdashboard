"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  coerceJobListSortFields,
  fetchHiringSignalJobs,
  fetchHiringSignalStats,
  hireSignalJobsListFromJson,
  asRecord,
  type HireSignalApiJson,
  type JobListFilters,
} from "@/services/graphql/hiringSignalService";

function strTrim(v: unknown): string {
  if (v == null) return "";
  const s = String(v).trim();
  return s;
}

/** First non-empty string among top-level keys and nested raw_payload (scraper/apify). */
function firstNonEmpty(...vals: unknown[]): string {
  for (const v of vals) {
    const s = strTrim(v);
    if (s) return s;
  }
  return "";
}

function workplaceTypesFromRecord(o: Record<string, unknown>): string[] {
  const wt = o.workplaceTypes ?? o.workplace_types;
  if (!Array.isArray(wt)) return [];
  return wt.map((x) => String(x)).filter(Boolean);
}

/** When API `title` is empty, derive a single-line label from description (runtime-confirmed gap). */
function titleFromJobDescription(plain: string, htmlFallback: string): string {
  const blocks = [
    plain.trim(),
    htmlFallback
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  ];
  for (const block of blocks) {
    if (!block) continue;
    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      let cand = line;
      const posMatch = /^position\s*:\s*(.+)$/i.exec(line);
      if (posMatch?.[1]?.trim()) cand = posMatch[1].trim();
      if (cand.length < 4 || cand.length > 240) continue;
      const lower = cand.toLowerCase();
      if (
        /^(about the job|job description|overview|responsibilities)\b/.test(
          lower,
        )
      )
        continue;
      return cand.length > 200 ? `${cand.slice(0, 197)}…` : cand;
    }
    const sentence = block.split(/(?<=[.!?])\s+/)[0]?.trim() ?? "";
    if (sentence.length >= 4 && sentence.length <= 240) {
      const lower = sentence.toLowerCase();
      if (!/^(about the job|job description)\b/.test(lower))
        return sentence.length > 200 ? `${sentence.slice(0, 197)}…` : sentence;
    }
  }
  return "";
}

/**
 * Parse job timestamps from job.server / Mongo / scraper: ISO strings, unix seconds or ms,
 * numeric strings, Mongo-extended `{$date}`. Drops Go zero times and invalid years.
 */
function parseFlexibleDate(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "number" && Number.isFinite(v)) {
    const ms = v > 1e12 ? v : v * 1000;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getUTCFullYear();
    if (y < 1990 || y > 2100) return "";
    return d.toISOString();
  }
  if (
    typeof v === "object" &&
    v !== null &&
    "$date" in (v as Record<string, unknown>)
  ) {
    return parseFlexibleDate((v as { $date: unknown }).$date);
  }
  const s = String(v).trim();
  if (!s || s.startsWith("0001-01-01")) return "";
  if (/^\d{10,13}$/.test(s)) {
    const n = Number(s);
    const ms = n > 1e12 ? n : n * 1000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      if (y >= 1990 && y <= 2100) return d.toISOString();
    }
  }
  const ms = Date.parse(s);
  if (!Number.isNaN(ms)) {
    const y = new Date(ms).getUTCFullYear();
    if (y < 1970 || y > 2100) return "";
    return new Date(ms).toISOString();
  }
  return "";
}

/** Approximate document time from Mongo ObjectId hex when posting dates are absent. */
function isoFromMongoObjectIdHex(id: unknown): string {
  const s = String(id ?? "").trim();
  if (!/^[a-fA-F0-9]{24}$/.test(s)) return "";
  const sec = Number.parseInt(s.slice(0, 8), 16);
  if (!Number.isFinite(sec)) return "";
  const d = new Date(sec * 1000);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

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
  location: string;
  lastSeen: string;
  /** From job.server `workplaceTypes` — used when `remoteAllowed` is absent. */
  workplaceTypes?: string[];
  /** When ingest embeds a logo URL (Apify raw / optional denorm). */
  companyLogoUrl?: string;
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
  const raw = asRecord(o.rawPayload) ?? asRecord(o.raw_payload) ?? {};

  let title = firstNonEmpty(o.title, raw.job_title, raw.title, raw.name);
  if (!title) {
    title = titleFromJobDescription(
      String(
        o.descriptionText ?? raw.job_description ?? raw.description_text ?? "",
      ),
      String(
        o.descriptionHTML ??
          o.descriptionHtml ??
          o.description ??
          raw.description_html ??
          "",
      ),
    );
  }

  const location = firstNonEmpty(
    o.formattedLocationFull,
    o.location,
    o.location_str,
    raw.job_location,
    raw.location,
    raw.formattedLocationFull,
    raw.formatted_location_full,
  );

  const postedAt = firstNonEmpty(
    parseFlexibleDate(o.postedAt),
    parseFlexibleDate(o.posted_at),
    parseFlexibleDate(raw.posted_at_timestamp),
    parseFlexibleDate(raw.time_posted),
    parseFlexibleDate(raw.postedAt),
    parseFlexibleDate(raw.posted_at),
    isoFromMongoObjectIdHex(o.id ?? o._id),
    parseFlexibleDate(o.ingestedAt),
    parseFlexibleDate(o.ingested_at),
    parseFlexibleDate(o.updatedAt),
    parseFlexibleDate(o.updated_at),
  );

  const companyLogoUrl = firstNonEmpty(
    o.companyLogoUrl,
    o.company_logo,
    raw.company_logo,
    raw.profile_pic,
  );

  const jobUrl = firstNonEmpty(
    o.jobUrl,
    o.job_url,
    o.link,
    raw.linkedin_job_url,
    raw.link,
  );

  const workplaceTypes = workplaceTypesFromRecord(o);
  let remoteAllowed = String(o.remoteAllowed ?? o.remote_allowed ?? "");
  if (!remoteAllowed.trim() && workplaceTypes.length > 0) {
    const blob = workplaceTypes.join(" ").toLowerCase();
    if (blob.includes("remote") || blob.includes("hybrid")) {
      remoteAllowed = workplaceTypes.join(", ");
    }
  }

  return {
    id: typeof o.id === "string" ? o.id : String(o._id ?? ""),
    linkedinJobId: String(o.linkedinJobId ?? o.linkedin_job_id ?? ""),
    runId: String(o.runId ?? o.run_id ?? ""),
    apifyItemId: String(o.apifyItemId ?? o.apify_item_id ?? ""),
    companyUuid: String(o.companyUuid ?? o.company_uuid ?? ""),
    companyName: String(o.companyName ?? o.company_name ?? ""),
    title,
    descriptionHtml: String(
      o.descriptionHTML ??
        o.descriptionHtml ??
        o.description ??
        raw.description_html ??
        raw.descriptionHtml ??
        "",
    ),
    postedAt,
    jobUrl,
    jobState: String(o.jobState ?? o.job_state ?? ""),
    remoteAllowed,
    employmentType: String(o.employmentType ?? o.employment_type ?? ""),
    seniority: String(o.seniorityLevel ?? o.seniority ?? ""),
    functionCategory: String(
      o.functionCategoryV2 ??
        o.function_category_v2 ??
        o.functionCategory ??
        "",
    ),
    industries: String(o.industries ?? ""),
    location,
    lastSeen: String(o.lastSeenAt ?? o.last_seen_at ?? o.lastSeen ?? ""),
    workplaceTypes,
    companyLogoUrl: companyLogoUrl || undefined,
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

  const [filters, setFilters] = useState<JobListFilters>(() => {
    const sortFields = coerceJobListSortFields(
      initial as Partial<JobListFilters> & {
        listSort?: "recent" | "oldest";
      },
    );
    return {
      titles: initial.titles,
      companies: initial.companies,
      locations: initial.locations,
      employmentType: initial.employmentType,
      employmentTypes: initial.employmentTypes,
      seniority: initial.seniority,
      functionCategory: initial.functionCategory,
      postedAfter: initial.postedAfter,
      postedBefore: initial.postedBefore,
      runId: initial.runId,
      workplaceTypes: initial.workplaceTypes,
      industries: initial.industries,
      excludedIndustries: initial.excludedIndustries,
      excludedTitles: initial.excludedTitles,
      excludedCompanies: initial.excludedCompanies,
      excludedLocations: initial.excludedLocations,
      salaryMin: initial.salaryMin,
      experienceBuckets: initial.experienceBuckets,
      roleTracks: initial.roleTracks,
      educationLevelMins: initial.educationLevelMins,
      clearanceMode: initial.clearanceMode,
      h1bOnly: initial.h1bOnly,
      skillsAll: initial.skillsAll,
      hideApplied: initial.hideApplied ?? false,
      countries: initial.countries,
      applyMethod: initial.applyMethod,
      sortKey: sortFields.sortKey,
      sortOrder: sortFields.sortOrder,
      limit: initial.limit ?? 25,
      offset: initial.offset ?? 0,
    };
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

  /** Ignore out-of-order responses when filters/sort change faster than the network. */
  const hireSignalFetchGen = useRef(0);

  const refetch = useCallback(async () => {
    const gen = ++hireSignalFetchGen.current;
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
      if (gen !== hireSignalFetchGen.current) {
        return;
      }
      const j = parseJobListPayload(jobsRes.hireSignal?.jobs);
      // #region agent log
      if (filters.sortKey === "title") {
        fetch("http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "fcf0fb",
          },
          body: JSON.stringify({
            sessionId: "fcf0fb",
            location: "useHiringSignals.ts:refetch:titleOrder",
            message: "Row title order sample after hire-signal fetch",
            data: {
              sortKey: filters.sortKey,
              sortOrder: filters.sortOrder,
              rowCount: j.data.length,
              titleInitials: j.data
                .slice(0, 12)
                .map((r) => (r.title || "").trim().slice(0, 1).toLowerCase()),
            },
            hypothesisId: "H-client-order",
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion
      setJobs(j.data);
      setTotal(j.total);
      setStats(parseStatsPayload(statsRes.hireSignal?.stats));
    } catch (e) {
      if (gen !== hireSignalFetchGen.current) {
        return;
      }
      const msg = e instanceof Error ? e.message : "Failed to load jobs";
      setError(msg);
      toast.error("Hiring signals", { description: msg });
    } finally {
      if (gen === hireSignalFetchGen.current) {
        setLoading(false);
        setStatsLoading(false);
      }
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
    (
      key: keyof JobListFilters,
      value: string | string[] | number | boolean | undefined,
    ) => {
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

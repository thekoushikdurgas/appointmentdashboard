/**
 * Persists last successful jobs list per filter key so the Jobs page can paint
 * immediately; refreshed on a 5-minute cadence (and on explicit refresh / mutations).
 */

import type { MappedJob } from "@/lib/jobs/jobsMapper";

const CACHE_VERSION = 1 as const;
const KEY_PREFIX = "c360:jobsList:v1:";
const MAX_JSON_CHARS = 4_000_000;

export interface JobsListFilterKeyParts {
  status: string;
  jobType: string;
  jobFamily: string;
}

export interface JobsListCachePayload {
  v: typeof CACHE_VERSION;
  savedAt: number;
  filterKey: string;
  jobs: MappedJob[];
}

export function buildJobsListFilterKey(filter?: {
  status?: string;
  type?: string;
  jobFamily?: string;
}): string {
  const status = filter?.status ?? "";
  const jobType = filter?.type ?? "";
  const jobFamily = filter?.jobFamily ?? "";
  return `${status}\u001f${jobType}\u001f${jobFamily}`;
}

export function jobsListCacheStorageKey(filterKey: string): string {
  return `${KEY_PREFIX}${filterKey}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readJobsListCache(
  filterKey: string,
): JobsListCachePayload | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(jobsListCacheStorageKey(filterKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if (o.v !== CACHE_VERSION || !Array.isArray(o.jobs)) return null;
    if (typeof o.filterKey !== "string" || o.filterKey !== filterKey)
      return null;
    return {
      v: CACHE_VERSION,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : 0,
      filterKey,
      jobs: o.jobs as MappedJob[],
    };
  } catch {
    return null;
  }
}

export function writeJobsListCache(filterKey: string, jobs: MappedJob[]): void {
  if (!isBrowser()) return;
  const full: JobsListCachePayload = {
    v: CACHE_VERSION,
    savedAt: Date.now(),
    filterKey,
    jobs,
  };
  try {
    const json = JSON.stringify(full);
    if (json.length > MAX_JSON_CHARS) return;
    localStorage.setItem(jobsListCacheStorageKey(filterKey), json);
  } catch {
    /* quota or private mode */
  }
}

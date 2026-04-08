"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { jobsService } from "@/services/graphql/jobsService";
import { mapJobs, type MappedJob } from "@/lib/jobs/jobsMapper";
import { shouldPollJob } from "@/lib/jobs/jobsUtils";
import {
  buildJobsListFilterKey,
  readJobsListCache,
  writeJobsListCache,
} from "@/lib/jobsListLocalCache";

/** Poll every 5s when active jobs exist, 15s otherwise (non-cached list mode). */
const ACTIVE_POLL_INTERVAL = 5000;
const IDLE_POLL_INTERVAL = 15000;

/** Jobs page: background list refresh cadence + localStorage TTL. */
const CACHED_LIST_REFRESH_MS = 5 * 60 * 1000;

export interface UseJobsOptions {
  /**
   * Hydrate from localStorage, refresh on a 5-minute timer instead of 5s/15s polling.
   * Use on the Jobs dashboard; keep default for other live views that need fast polling.
   */
  cachedList?: boolean;
}

interface UseJobsReturn {
  jobs: MappedJob[];
  loading: boolean;
  /** True while refetching with rows already shown (cached list mode). */
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  retry: (id: string) => Promise<void>;
  pause: (id: string) => Promise<void>;
  resume: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  pauseConnectra: (uuid: string) => Promise<void>;
  resumeConnectra: (uuid: string) => Promise<void>;
  terminateConnectra: (uuid: string) => Promise<void>;
}

export function useJobs(
  filter?: {
    status?: string;
    type?: string;
    jobFamily?: string;
  },
  options?: UseJobsOptions,
): UseJobsReturn {
  const cachedList = options?.cachedList === true;
  const status = filter?.status;
  const jobType = filter?.type;
  const jobFamily = filter?.jobFamily;

  const filterKey = useMemo(
    () => buildJobsListFilterKey({ status, type: jobType, jobFamily }),
    [status, jobType, jobFamily],
  );

  const [jobs, setJobs] = useState<MappedJob[]>(() => {
    if (!cachedList) return [];
    return readJobsListCache(filterKey)?.jobs ?? [];
  });
  const [loading, setLoading] = useState(() => {
    if (!cachedList) return true;
    return readJobsListCache(filterKey) == null;
  });
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const data = await jobsService.list({
          status,
          jobType,
          jobFamily,
        });
        const mapped = mapJobs(data.jobs);
        setJobs(mapped);
        setError(null);
        if (cachedList) {
          writeJobsListCache(filterKey, mapped);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load jobs");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [status, jobType, jobFamily, cachedList, filterKey],
  );

  useEffect(() => {
    if (cachedList) return;
    void fetchJobs();
  }, [cachedList, fetchJobs]);

  useEffect(() => {
    if (cachedList) return;
    const hasActive = jobs.some((j) => shouldPollJob(j.status));
    const interval = hasActive ? ACTIVE_POLL_INTERVAL : IDLE_POLL_INTERVAL;
    intervalRef.current = setInterval(() => fetchJobs(true), interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cachedList, jobs, fetchJobs]);

  useEffect(() => {
    if (!cachedList) return;

    let cancelled = false;
    let initialTimer: ReturnType<typeof setTimeout> | null = null;

    const cached = readJobsListCache(filterKey);
    if (cached) {
      setJobs(cached.jobs);
      setError(null);
      setLoading(false);
    } else {
      setJobs([]);
      setLoading(true);
    }

    const c = readJobsListCache(filterKey);
    const age = c ? Date.now() - c.savedAt : Infinity;
    const hasRows = c != null && c.jobs.length > 0;

    if (c == null || age >= CACHED_LIST_REFRESH_MS) {
      void fetchJobs(hasRows);
    } else {
      initialTimer = setTimeout(() => {
        if (!cancelled) void fetchJobs(true);
      }, CACHED_LIST_REFRESH_MS - age);
    }

    const interval = setInterval(() => {
      if (!cancelled) void fetchJobs(true);
    }, CACHED_LIST_REFRESH_MS);

    return () => {
      cancelled = true;
      if (initialTimer) clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [cachedList, filterKey, fetchJobs]);

  const retry = async (jobId: string) => {
    await jobsService.retry(jobId);
    await fetchJobs(true);
  };

  const pause = async (jobId: string) => {
    await jobsService.pause(jobId);
    await fetchJobs(true);
  };

  const resume = async (jobId: string) => {
    await jobsService.resume(jobId);
    await fetchJobs(true);
  };

  const cancel = async (jobId: string) => {
    await jobsService.cancel(jobId);
    await fetchJobs(true);
  };

  const pauseConnectra = async (uuid: string) => {
    await jobsService.pauseConnectraJob(uuid);
    await fetchJobs(true);
  };

  const resumeConnectra = async (uuid: string) => {
    await jobsService.resumeConnectraJob(uuid);
    await fetchJobs(true);
  };

  const terminateConnectra = async (uuid: string) => {
    await jobsService.terminateConnectraJob(uuid);
    await fetchJobs(true);
  };

  const isRefreshing = loading && jobs.length > 0;

  return {
    jobs,
    loading,
    isRefreshing,
    error,
    refresh: () => fetchJobs(),
    retry,
    pause,
    resume,
    cancel,
    pauseConnectra,
    resumeConnectra,
    terminateConnectra,
  };
}

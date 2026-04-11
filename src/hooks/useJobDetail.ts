"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { jobsService, type Job } from "@/services/graphql/jobsService";
import { isSuccessfulTerminalJobStatus } from "@/lib/jobs/jobsUtils";

function isTerminal(status: string): boolean {
  const u = status.toUpperCase();
  if (isSuccessfulTerminalJobStatus(status)) return true;
  return (
    u === "FAILED" || u === "CANCELLED" || u === "CANCELED" || u === "ERROR"
  );
}

export interface UseJobDetailReturn {
  job: Job | null;
  loading: boolean;
  error: string | null;
  polling: boolean;
  refresh: () => void;
}

/**
 * Fetch a job by ID and poll while it is in a non-terminal state.
 * Pass `null` to disable fetching (e.g., when no row is expanded).
 */
export function useJobDetail(
  jobId: string | null,
  pollIntervalMs = 3000,
): UseJobDetailReturn {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const j = await jobsService.get(jobId);
      if (!cancelledRef.current) {
        setJob(j);
        setLoading(false);
        if (!isTerminal(j.status)) {
          timerRef.current = setTimeout(() => void fetchJob(), pollIntervalMs);
        }
      }
    } catch (e) {
      if (!cancelledRef.current) {
        setError(e instanceof Error ? e.message : "Failed to fetch job");
        setLoading(false);
      }
    }
  }, [jobId, pollIntervalMs]);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setError(null);
      setLoading(false);
      return;
    }
    void fetchJob();
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [jobId, fetchJob]);

  const isPolling = !!job && !isTerminal(job.status);

  return {
    job,
    loading,
    error,
    polling: isPolling,
    refresh: () => void fetchJob(),
  };
}

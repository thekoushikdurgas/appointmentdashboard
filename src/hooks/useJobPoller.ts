"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { jobsService } from "@/services/graphql/jobsService";

const TERMINAL_STATUSES = ["completed", "failed", "cancelled", "error"];
const POLL_INTERVAL_MS = 2500;

function isTerminalStatus(status: string): boolean {
  const s = status.toLowerCase();
  return TERMINAL_STATUSES.some((t) => s.includes(t));
}

function isCompletedStatus(status: string): boolean {
  return status.toLowerCase().includes("completed");
}

export interface UseJobPollerOptions {
  /** Called once the job reaches a terminal "completed" state. */
  onCompleted?: () => void;
  /** Called once the job reaches a terminal failure state. */
  onFailed?: (status: string) => void;
  intervalMs?: number;
}

export interface UseJobPollerResult {
  jobStatus: string | null;
  /** Last polled job progress 0–100 from `jobsService.get`, if available. */
  jobProgress: number | null;
  polling: boolean;
  isTerminal: boolean;
  startPolling: (jobId: string, initialStatus?: string) => void;
  reset: () => void;
}

/**
 * Generic job poller that uses `jobsService.get(jobId)` to track status.
 * Replaces the inline `window.setTimeout` polling in ContactImportModal and
 * ContactExportModal.
 */
export function useJobPoller(
  options: UseJobPollerOptions = {},
): UseJobPollerResult {
  const { onCompleted, onFailed, intervalMs = POLL_INTERVAL_MS } = options;

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number | null>(null);
  const [polling, setPolling] = useState(false);

  const cancelledRef = useRef(false);
  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  useEffect(() => {
    onFailedRef.current = onFailed;
  }, [onFailed]);

  useEffect(() => {
    if (!jobId) return;

    cancelledRef.current = false;
    setPolling(true);

    const tick = async () => {
      if (cancelledRef.current) return;
      try {
        const job = await jobsService.get(jobId);
        if (cancelledRef.current) return;
        setJobStatus(job.status);
        if (isTerminalStatus(job.status)) {
          setPolling(false);
          cancelledRef.current = true;
          if (isCompletedStatus(job.status)) {
            onCompletedRef.current?.();
          } else {
            onFailedRef.current?.(job.status);
          }
        } else {
          setTimeout(() => void tick(), intervalMs);
        }
      } catch {
        if (!cancelledRef.current) {
          setTimeout(() => void tick(), intervalMs);
        }
      }
    };

    void tick();

    return () => {
      cancelledRef.current = true;
      setPolling(false);
    };
  }, [jobId, intervalMs]);

  const startPolling = useCallback((id: string, initialStatus?: string) => {
    setJobStatus(initialStatus ?? null);
    setJobProgress(null);
    setJobId(id);
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    setJobId(null);
    setJobStatus(null);
    setJobProgress(null);
    setPolling(false);
  }, []);

  const isTerminal = !!jobStatus && isTerminalStatus(jobStatus);

  return {
    jobStatus,
    jobProgress,
    polling,
    isTerminal,
    startPolling,
    reset,
  };
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  cancelHireSignalRun,
  fetchHireSignalRunMetrics,
  fetchHireSignalRuns,
  fetchListScrapeJobs,
  fetchScrapeJobJobs,
  hireSignalRunsFromJson,
  pauseHireSignalRun,
  refreshHireSignalRun,
  resumeHireSignalRun,
} from "@/services/graphql/hiringSignalService";
import {
  downloadTextFile,
  linkedinJobsPayloadToCsv,
  satelliteStatusFromRow,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";

/**
 * True when a scraper.server session can be cancelled (satellite or tracked row).
 */
export function hireSignalRunCanCancel(
  status: string | undefined | null,
): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "pending" || s === "running" || s === "paused";
}

/** Pause is valid for queued or active worker sessions. */
export function hireSignalRunCanPause(
  status: string | undefined | null,
): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "pending" || s === "running";
}

export function hireSignalRunCanResume(
  status: string | undefined | null,
): boolean {
  return (status ?? "").toLowerCase() === "paused";
}

/** How many satellite runs to load for Overview “latest run” preview (first page). */
export const HIRE_SIGNAL_OVERVIEW_RUNS_LIMIT = 25;

/** Satellite table filter on the Runs tab (client filter for active only). */
export type HireSignalSatelliteFilter = "active" | "all";

export type UseHireSignalRunsOpts = {
  /** 1-based page when `mainTab === "runs"`. */
  satellitePage: number;
  /** Page size for satellite runs on the Runs tab. */
  runsPageSize: number;
  /** Active = load a batch and filter client-side; All = server-paginated pages. */
  satelliteFilter?: HireSignalSatelliteFilter;
};

export function useHireSignalRuns(
  mainTab: "overview" | "signals" | "runs",
  opts: UseHireSignalRunsOpts,
) {
  const { satellitePage, runsPageSize, satelliteFilter = "active" } = opts;

  const [runsLoading, setRunsLoading] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [satelliteRunsRows, setSatelliteRunsRows] = useState<
    Record<string, unknown>[]
  >([]);
  const [satelliteRunsTotal, setSatelliteRunsTotal] = useState(0);
  const [scrapeJobsPayload, setScrapeJobsPayload] = useState<unknown>(null);
  const [runActionId, setRunActionId] = useState<string | null>(null);
  const [cancelRunId, setCancelRunId] = useState<string | null>(null);
  const [pauseRunId, setPauseRunId] = useState<string | null>(null);
  const [resumeRunId, setResumeRunId] = useState<string | null>(null);
  const [scrapeDownloadId, setScrapeDownloadId] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    setRunsLoading(true);
    try {
      const runsAllServerPage = mainTab === "runs" && satelliteFilter === "all";
      const limit = runsAllServerPage
        ? runsPageSize
        : mainTab === "runs"
          ? 500
          : HIRE_SIGNAL_OVERVIEW_RUNS_LIMIT;
      const offset = runsAllServerPage
        ? Math.max(0, satellitePage - 1) * runsPageSize
        : 0;

      const [r, s, m] = await Promise.all([
        fetchHireSignalRuns(limit, offset),
        fetchListScrapeJobs(80, 0),
        fetchHireSignalRunMetrics(),
      ]);
      const raw = r.hireSignal?.runs ?? null;
      const { rows, total } = hireSignalRunsFromJson(raw);
      setSatelliteRunsRows(rows);
      setSatelliteRunsTotal(total);
      setScrapeJobsPayload(s.hireSignal?.listScrapeJobs ?? null);
      const mj = m.hireSignal?.hireSignalRunMetrics;
      setMetrics(
        mj && typeof mj === "object" && !Array.isArray(mj)
          ? (mj as Record<string, unknown>)
          : null,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load runs";
      toast.error("Runs", { description: msg });
    } finally {
      setRunsLoading(false);
    }
  }, [mainTab, runsPageSize, satellitePage, satelliteFilter]);

  useEffect(() => {
    if (mainTab === "runs" || mainTab === "overview") void loadRuns();
  }, [mainTab, loadRuns]);

  const trackedScrapeRows = useMemo(() => {
    if (!Array.isArray(scrapeJobsPayload)) return [];
    return scrapeJobsPayload.filter(
      (x): x is Record<string, unknown> =>
        !!x && typeof x === "object" && !Array.isArray(x),
    );
  }, [scrapeJobsPayload]);

  useEffect(() => {
    const satActive = satelliteRunsRows.some((row) => {
      const st = satelliteStatusFromRow(row);
      return st === "pending" || st === "running" || st === "paused";
    });
    const trackActive = trackedScrapeRows.some((row) => {
      const st = String(row.status ?? "").toLowerCase();
      return st === "pending" || st === "running" || st === "paused";
    });
    if (!satActive && !trackActive) return;
    const id = setInterval(() => void loadRuns(), 15_000);
    return () => clearInterval(id);
  }, [satelliteRunsRows, trackedScrapeRows, loadRuns]);

  const onRefreshRun = useCallback(
    async (runId: string) => {
      const rid = runId.trim();
      if (!rid) return;
      setRunActionId(rid);
      try {
        await refreshHireSignalRun(rid);
        toast.success("Run status refreshed");
        void loadRuns();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Refresh failed";
        toast.error("Refresh run", { description: msg });
      } finally {
        setRunActionId(null);
      }
    },
    [loadRuns],
  );

  const onCancelRun = useCallback(
    async (runId: string) => {
      const rid = runId.trim();
      if (!rid) return;
      setCancelRunId(rid);
      try {
        await cancelHireSignalRun(rid);
        toast.success("Run cancelled");
        void loadRuns();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Cancel failed";
        toast.error("Cancel run", { description: msg });
      } finally {
        setCancelRunId(null);
      }
    },
    [loadRuns],
  );

  const onPauseRun = useCallback(
    async (runId: string) => {
      const rid = runId.trim();
      if (!rid) return;
      setPauseRunId(rid);
      try {
        await pauseHireSignalRun(rid);
        toast.success("Pause requested");
        void loadRuns();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Pause failed";
        toast.error("Pause run", { description: msg });
      } finally {
        setPauseRunId(null);
      }
    },
    [loadRuns],
  );

  const onResumeRun = useCallback(
    async (runId: string) => {
      const rid = runId.trim();
      if (!rid) return;
      setResumeRunId(rid);
      try {
        await resumeHireSignalRun(rid);
        toast.success("Run resumed");
        void loadRuns();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Resume failed";
        toast.error("Resume run", { description: msg });
      } finally {
        setResumeRunId(null);
      }
    },
    [loadRuns],
  );

  const onDownloadCsv = useCallback(async (scrapeJobId: string) => {
    const id = scrapeJobId.trim();
    if (!id) return;
    setScrapeDownloadId(id);
    try {
      const res = await fetchScrapeJobJobs(id, 2000, 0);
      const raw = res.hireSignal?.scrapeJobJobs;
      const csv = linkedinJobsPayloadToCsv(raw);
      if (!csv) {
        toast.message("No rows yet", {
          description:
            "Wait until the scrape session is done and jobs are collected, then try again.",
        });
        return;
      }
      downloadTextFile(`hiring-signals-scrape-${id.slice(0, 8)}.csv`, csv);
      toast.success("CSV downloaded");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Export failed";
      toast.error("CSV export", { description: msg });
    } finally {
      setScrapeDownloadId(null);
    }
  }, []);

  return {
    runsLoading,
    metrics,
    runActionId,
    cancelRunId,
    pauseRunId,
    resumeRunId,
    scrapeDownloadId,
    satelliteRunsRows,
    satelliteRunsTotal,
    trackedScrapeRows,
    loadRuns,
    onRefreshRun,
    onCancelRun,
    onPauseRun,
    onResumeRun,
    onDownloadCsv,
  };
}

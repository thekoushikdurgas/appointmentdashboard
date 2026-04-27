"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  fetchHireSignalRuns,
  fetchListScrapeJobs,
  fetchScrapeJobJobs,
  hireSignalRunsFromJson,
  refreshHireSignalRun,
} from "@/services/graphql/hiringSignalService";
import {
  downloadTextFile,
  linkedinJobsPayloadToCsv,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";

/** How many satellite runs to load for Overview “latest run” preview (first page). */
export const HIRE_SIGNAL_OVERVIEW_RUNS_LIMIT = 25;

export type UseHireSignalRunsOpts = {
  /** 1-based page when `mainTab === "runs"` (server-side offset). */
  satellitePage: number;
  /** Page size for satellite runs on the Runs tab. */
  runsPageSize: number;
};

export function useHireSignalRuns(
  mainTab: "overview" | "signals" | "runs",
  opts: UseHireSignalRunsOpts,
) {
  const { satellitePage, runsPageSize } = opts;

  const [runsLoading, setRunsLoading] = useState(false);
  const [satelliteRunsRows, setSatelliteRunsRows] = useState<
    Record<string, unknown>[]
  >([]);
  const [satelliteRunsTotal, setSatelliteRunsTotal] = useState(0);
  const [scrapeJobsPayload, setScrapeJobsPayload] = useState<unknown>(null);
  const [runActionId, setRunActionId] = useState<string | null>(null);
  const [scrapeDownloadId, setScrapeDownloadId] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    setRunsLoading(true);
    try {
      const limit =
        mainTab === "runs" ? runsPageSize : HIRE_SIGNAL_OVERVIEW_RUNS_LIMIT;
      const offset =
        mainTab === "runs" ? Math.max(0, satellitePage - 1) * runsPageSize : 0;

      const [r, s] = await Promise.all([
        fetchHireSignalRuns(limit, offset),
        fetchListScrapeJobs(30, 0),
      ]);
      const raw = r.hireSignal?.runs ?? null;
      const { rows, total } = hireSignalRunsFromJson(raw);
      setSatelliteRunsRows(rows);
      setSatelliteRunsTotal(total);
      setScrapeJobsPayload(s.hireSignal?.listScrapeJobs ?? null);
    } catch (e) {
      const m = e instanceof Error ? e.message : "Failed to load runs";
      toast.error("Runs", { description: m });
    } finally {
      setRunsLoading(false);
    }
  }, [mainTab, runsPageSize, satellitePage]);

  useEffect(() => {
    if (mainTab === "runs" || mainTab === "overview") void loadRuns();
  }, [mainTab, loadRuns]);

  const onRefreshRun = useCallback(
    async (runId: string) => {
      const rid = runId.trim();
      if (!rid) return;
      setRunActionId(rid);
      try {
        await refreshHireSignalRun(rid);
        toast.success("Run status refreshed from Apify");
        void loadRuns();
      } catch (e) {
        const m = e instanceof Error ? e.message : "Refresh failed";
        toast.error("Refresh run", { description: m });
      } finally {
        setRunActionId(null);
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
            "Wait until the run succeeds and jobs are ingested, then try again.",
        });
        return;
      }
      downloadTextFile(`hiring-signals-scrape-${id.slice(0, 8)}.csv`, csv);
      toast.success("CSV downloaded");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Export failed";
      toast.error("CSV export", { description: m });
    } finally {
      setScrapeDownloadId(null);
    }
  }, []);

  const trackedScrapeRows = useMemo(() => {
    if (!Array.isArray(scrapeJobsPayload)) return [];
    return scrapeJobsPayload.filter(
      (x): x is Record<string, unknown> =>
        !!x && typeof x === "object" && !Array.isArray(x),
    );
  }, [scrapeJobsPayload]);

  return {
    runsLoading,
    runActionId,
    scrapeDownloadId,
    satelliteRunsRows,
    satelliteRunsTotal,
    trackedScrapeRows,
    loadRuns,
    onRefreshRun,
    onDownloadCsv,
  };
}

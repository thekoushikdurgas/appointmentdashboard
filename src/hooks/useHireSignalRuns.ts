"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  asRecord,
  fetchHireSignalRuns,
  fetchListScrapeJobs,
  fetchScrapeJobJobs,
  refreshHireSignalRun,
} from "@/services/graphql/hiringSignalService";
import {
  downloadTextFile,
  linkedinJobsPayloadToCsv,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";

export function useHireSignalRuns(mainTab: "overview" | "signals" | "runs") {
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsPayload, setRunsPayload] = useState<unknown>(null);
  const [scrapeJobsPayload, setScrapeJobsPayload] = useState<unknown>(null);
  const [runActionId, setRunActionId] = useState<string | null>(null);
  const [scrapeDownloadId, setScrapeDownloadId] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    setRunsLoading(true);
    try {
      const [r, s] = await Promise.all([
        fetchHireSignalRuns(25),
        fetchListScrapeJobs(30, 0),
      ]);
      setRunsPayload(r.hireSignal?.runs ?? null);
      setScrapeJobsPayload(s.hireSignal?.listScrapeJobs ?? null);
    } catch (e) {
      const m = e instanceof Error ? e.message : "Failed to load runs";
      toast.error("Runs", { description: m });
    } finally {
      setRunsLoading(false);
    }
  }, []);

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

  const satelliteRunsRows = useMemo(() => {
    const env = asRecord(runsPayload);
    const data = env?.data;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (x): x is Record<string, unknown> =>
        !!x && typeof x === "object" && !Array.isArray(x),
    );
  }, [runsPayload]);

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
    trackedScrapeRows,
    loadRuns,
    onRefreshRun,
    onDownloadCsv,
  };
}

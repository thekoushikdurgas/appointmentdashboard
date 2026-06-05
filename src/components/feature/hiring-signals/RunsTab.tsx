"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History, Play, RefreshCw, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import {
  formatHireSignalPostedParts,
  isHireSignalPostedDateOnly,
} from "@/lib/jobs/hiringSignalPostedDate";
import {
  hireSignalRunFinishedMs,
  hireSignalRunStartedMs,
  sortHireSignalRunRows,
  type HireSignalRunSortDir,
  type HireSignalRunSortKey,
} from "@/lib/hiringSignalRunsSort";
import type { TableSortDir } from "@/components/ui/Table";
import {
  hireSignalRunCanCancel,
  hireSignalRunCanPause,
  hireSignalRunCanResume,
  useHireSignalRuns,
} from "@/hooks/useHireSignalRuns";
import {
  satelliteKeywordsFromRow,
  satelliteSessionProgressProps,
  scrapeStatusBadgeColor,
  satelliteRunIdFromRow,
  satelliteStatusFromRow,
  satelliteJobsCollected,
  satelliteJobsCompletionRatio,
  satelliteJobsCountSummary,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { QueueMetricsBar } from "@/components/feature/hiring-signals/QueueMetricsBar";
import { ScrapeSessionCard } from "@/components/feature/hiring-signals/ScrapeSessionCard";

export const RUNS_PAGE_SIZE = 10;

export interface RunsTabProps {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onOpenRunScrapeModal: () => void;
  drillSignalsByRun: (runId: string) => void;
  /** Increment (e.g. after queuing a scrape) to refetch runs + metrics. */
  reloadTick?: number;
}

export function RunsTab({
  isAdmin,
  isSuperAdmin,
  onOpenRunScrapeModal,
  drillSignalsByRun,
  reloadTick = 0,
}: RunsTabProps) {
  const [satellitePage, setSatellitePage] = useState(1);
  const [trackedPage, setTrackedPage] = useState(1);
  const [satelliteFilter, setSatelliteFilter] = useState<"active" | "all">(
    "active",
  );
  const [runsSortKey, setRunsSortKey] = useState<HireSignalRunSortKey | null>(
    "started",
  );
  const [runsSortDir, setRunsSortDir] = useState<HireSignalRunSortDir>("desc");
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false);

  const {
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
    purgeSessionsLoading,
    onPurgeAllSessions,
  } = useHireSignalRuns("runs", {
    satellitePage,
    runsPageSize: RUNS_PAGE_SIZE,
    satelliteFilter,
  });

  useEffect(() => {
    if (reloadTick <= 0) return;
    void loadRuns();
  }, [reloadTick, loadRuns]);

  useEffect(() => {
    setTrackedPage(1);
  }, [trackedScrapeRows.length]);

  const filteredSatelliteRows = useMemo(() => {
    if (satelliteFilter === "all") return satelliteRunsRows;
    return satelliteRunsRows.filter((row) => {
      const st = satelliteStatusFromRow(row);
      return st === "pending" || st === "running" || st === "paused";
    });
  }, [satelliteRunsRows, satelliteFilter]);

  const sortedSatelliteRows = useMemo(() => {
    if (!runsSortKey) return filteredSatelliteRows;
    return sortHireSignalRunRows(
      filteredSatelliteRows,
      runsSortKey,
      runsSortDir,
    );
  }, [filteredSatelliteRows, runsSortKey, runsSortDir]);

  const satellitePaged = useMemo(() => {
    const start = (satellitePage - 1) * RUNS_PAGE_SIZE;
    return sortedSatelliteRows.slice(start, start + RUNS_PAGE_SIZE);
  }, [sortedSatelliteRows, satellitePage]);

  const satelliteTotalFiltered = filteredSatelliteRows.length;
  const satellitePaginationTotal =
    satelliteFilter === "all" ? satelliteRunsTotal : satelliteTotalFiltered;

  useEffect(() => {
    const maxPage = Math.max(
      1,
      Math.ceil(satellitePaginationTotal / RUNS_PAGE_SIZE),
    );
    if (satellitePage > maxPage) setSatellitePage(maxPage);
  }, [satellitePaginationTotal, satellitePage]);

  const trackedPaged = useMemo(() => {
    const start = (trackedPage - 1) * RUNS_PAGE_SIZE;
    return trackedScrapeRows.slice(start, start + RUNS_PAGE_SIZE);
  }, [trackedScrapeRows, trackedPage]);

  const metricsTotal = metrics ? Number(metrics.total) : 0;
  const metricsActive = metrics
    ? Number(metrics.pending) + Number(metrics.running) + Number(metrics.paused)
    : 0;

  const renderRunDateTime = useCallback((raw: string) => {
    const s = raw.trim();
    if (!s) {
      return <span className="c360-text-2xs c360-text-muted">—</span>;
    }
    const { date, time } = formatHireSignalPostedParts(s);
    const dateOnly = isHireSignalPostedDateOnly(s);
    return (
      <span
        className="c360-hs-grid-posted"
        title={dateOnly ? `Date only in index: ${s}` : s}
      >
        <span className="c360-hs-grid-posted__date">{date}</span>
        {time ? (
          <span className="c360-hs-grid-posted__time">{time}</span>
        ) : null}
      </span>
    );
  }, []);

  const handleRunsSortChange = useCallback(
    (key: string | null, dir: TableSortDir | null) => {
      if (!key || !dir) {
        setRunsSortKey(null);
        setRunsSortDir("desc");
      } else {
        setRunsSortKey(key as HireSignalRunSortKey);
        setRunsSortDir(dir);
      }
      setSatellitePage(1);
    },
    [],
  );

  const satelliteColumns: TableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: "runId",
        header: "Session / run ID",
        sortable: true,
        sortValue: (row) => satelliteRunIdFromRow(row),
        render: (row) => {
          const full = satelliteRunIdFromRow(row);
          const short =
            full.length > 14 ? `${full.slice(0, 14)}…` : full || "—";
          return (
            <Tooltip content={full || "—"} placement="top">
              <span className="c360-font-mono c360-text-2xs">{short}</span>
            </Tooltip>
          );
        },
      },
      {
        key: "keywords",
        header: "Keywords",
        sortable: true,
        sortValue: (row) => satelliteKeywordsFromRow(row),
        render: (row) => {
          const full = satelliteKeywordsFromRow(row);
          if (!full) {
            return (
              <span className="c360-text-2xs c360-text-muted c360-italic">
                —
              </span>
            );
          }
          const short =
            full.length > 56 ? `${full.slice(0, 54).trimEnd()}…` : full;
          return (
            <Tooltip content={full} placement="top">
              <span className="c360-block c360-max-w-[14rem] c360-truncate c360-text-2xs c360-text-ink">
                {short}
              </span>
            </Tooltip>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        sortValue: (row) => satelliteStatusFromRow(row),
        render: (row) => {
          const st = satelliteStatusFromRow(row) || "—";
          const jobsLine = satelliteJobsCountSummary(row);
          return (
            <div className="c360-flex c360-flex-col c360-gap-1 c360-items-start">
              <Badge color={scrapeStatusBadgeColor(st)} size="sm">
                {st}
              </Badge>
              <span className="c360-text-2xs c360-text-muted c360-leading-tight">
                {jobsLine}
              </span>
            </div>
          );
        },
      },
      {
        key: "progress",
        header: "Jobs vs target",
        sortable: true,
        sortValue: (row) => {
          const ratio = satelliteJobsCompletionRatio(row);
          if (ratio != null) return ratio;
          return satelliteJobsCollected(row);
        },
        render: (row) => {
          const p = satelliteSessionProgressProps(row);
          return (
            <div className="c360-min-w-[10rem] c360-max-w-[14rem]">
              <Progress
                value={p.value}
                max={p.max}
                size="sm"
                color={p.color}
                label={p.label}
                showValue={p.showValue}
                indeterminate={p.indeterminate}
              />
            </div>
          );
        },
      },
      {
        key: "started",
        header: "Started",
        sortable: true,
        sortValue: (row) => hireSignalRunStartedMs(row),
        render: (row) => {
          const raw =
            String(
              row.started_at ?? row.startedAt ?? row.StartedAt ?? "",
            ).trim() ||
            String(row.created_at ?? row.createdAt ?? row.CreatedAt ?? "");
          return renderRunDateTime(raw);
        },
      },
      {
        key: "finished",
        header: "Finished",
        sortable: true,
        sortValue: (row) => hireSignalRunFinishedMs(row),
        render: (row) => {
          const raw = String(
            row.finished_at ??
              row.finishedAt ??
              row.FinishedAt ??
              row.completed_at ??
              row.completedAt ??
              row.CompletedAt ??
              "",
          );
          return renderRunDateTime(raw);
        },
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (row) => {
          const rid = satelliteRunIdFromRow(row);
          const st = satelliteStatusFromRow(row);
          const canCancel = isAdmin && !!rid && hireSignalRunCanCancel(st);
          const canPause = isAdmin && !!rid && hireSignalRunCanPause(st);
          const canResume = isAdmin && !!rid && hireSignalRunCanResume(st);
          return (
            <div className="c360-flex c360-flex-wrap c360-items-center c360-justify-end c360-gap-1">
              {rid ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => drillSignalsByRun(rid)}
                >
                  Signals
                </Button>
              ) : null}
              {canPause ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pauseRunId === rid}
                  onClick={() => void onPauseRun(rid)}
                >
                  {pauseRunId === rid ? "Pausing…" : "Pause"}
                </Button>
              ) : null}
              {canResume ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={resumeRunId === rid}
                  leftIcon={<Play size={14} />}
                  onClick={() => void onResumeRun(rid)}
                >
                  {resumeRunId === rid ? "Resuming…" : "Resume"}
                </Button>
              ) : null}
              {canCancel ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={cancelRunId === rid}
                  onClick={() => void onCancelRun(rid)}
                >
                  {cancelRunId === rid ? "Cancelling…" : "Cancel"}
                </Button>
              ) : null}
              {rid ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={runActionId === rid}
                  onClick={() => void onRefreshRun(rid)}
                >
                  {runActionId === rid ? "…" : "Refresh"}
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [
      drillSignalsByRun,
      isAdmin,
      onRefreshRun,
      onCancelRun,
      onPauseRun,
      onResumeRun,
      renderRunDateTime,
      runActionId,
      cancelRunId,
      pauseRunId,
      resumeRunId,
    ],
  );

  return (
    <div className="c360-flex c360-flex-col c360-gap-6 c360-px-4">
      <QueueMetricsBar metrics={metrics} loading={runsLoading} />

      <section className="c360-space-y-3">
        <h3 className="c360-m-0 c360-text-2xs c360-font-semibold c360-uppercase c360-tracking-wide c360-text-muted">
          Your tracked scrapes (gateway)
        </h3>
        <div className="c360-2col-grid c360-gap-4">
          {trackedPaged.map((row) => (
            <ScrapeSessionCard
              key={String(row.id ?? JSON.stringify(row))}
              row={row}
              showManageActions={isAdmin}
              onDrillSignals={drillSignalsByRun}
              onCancel={onCancelRun}
              onPause={onPauseRun}
              onResume={onResumeRun}
              onDownloadCsv={onDownloadCsv}
              onRefresh={onRefreshRun}
              cancelRunId={cancelRunId}
              pauseRunId={pauseRunId}
              resumeRunId={resumeRunId}
              scrapeDownloadId={scrapeDownloadId}
              runActionId={runActionId}
            />
          ))}
        </div>
        {trackedScrapeRows.length === 0 && !runsLoading ? (
          <p className="c360-m-0 c360-text-sm c360-text-muted">
            No tracked scrapes yet.
            {isSuperAdmin ? (
              <>
                {" "}
                Use <strong>Run scrape</strong> to queue one.
              </>
            ) : null}
          </p>
        ) : null}
        {trackedScrapeRows.length > RUNS_PAGE_SIZE ? (
          <Pagination
            className="c360-hs-table-pagination"
            page={trackedPage}
            pageSize={RUNS_PAGE_SIZE}
            total={trackedScrapeRows.length}
            onPageChange={setTrackedPage}
          />
        ) : null}
      </section>

      <Accordion
        variant="bordered"
        defaultOpen={["all-sessions"]}
        items={[
          {
            id: "all-sessions",
            title: (
              <span className="c360-flex c360-items-center c360-gap-2 c360-text-sm c360-font-medium">
                <History size={16} />
                All scraper sessions (satellite)
              </span>
            ),
            content: (
              <div className="c360-space-y-4 c360-pt-2">
                <div className="c360-hs-runs-sessions-toolbar c360-flex c360-flex-wrap c360-items-center c360-justify-between c360-gap-2">
                  <div className="c360-hs-runs-sessions-toolbar__lead c360-flex c360-min-w-0">
                    <div>
                      <h2 className="c360-m-0 c360-text-sm c360-font-semibold c360-text-ink">
                        Scraper sessions &amp; tracked jobs
                      </h2>
                      <p className="c360-m-0 c360-mt-1 c360-text-2xs c360-text-muted">
                        Manage LinkedIn job scrapes (scraper.server). Interval
                        repeats appear on each card.
                      </p>
                    </div>
                    <div className="c360-flex c360-flex-wrap c360-gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          satelliteFilter === "active" ? "primary" : "outline"
                        }
                        onClick={() => {
                          setSatelliteFilter("active");
                          setSatellitePage(1);
                        }}
                      >
                        Active
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          satelliteFilter === "all" ? "primary" : "outline"
                        }
                        onClick={() => {
                          setSatelliteFilter("all");
                          setSatellitePage(1);
                        }}
                      >
                        All
                      </Button>
                    </div>
                  </div>
                  <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="c360-gap-2"
                      onClick={() => void loadRuns()}
                      disabled={runsLoading}
                      leftIcon={
                        <RefreshCw
                          size={15}
                          className={cn(runsLoading && "c360-spin")}
                        />
                      }
                    >
                      Reload
                    </Button>
                    {isSuperAdmin ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="c360-gap-2"
                          disabled={purgeSessionsLoading || runsLoading}
                          leftIcon={<Trash2 size={15} />}
                          onClick={() => setPurgeConfirmOpen(true)}
                        >
                          Clear all sessions
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          leftIcon={<Play size={15} />}
                          onClick={onOpenRunScrapeModal}
                        >
                          Run scrape
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="c360-overflow-x-auto c360-rounded c360-border c360-border-ink-8">
                  <Table<Record<string, unknown>>
                    columns={satelliteColumns}
                    data={satellitePaged}
                    sortKey={runsSortKey}
                    sortDir={runsSortDir}
                    onSortChange={handleRunsSortChange}
                    defaultSortDir="desc"
                    keyExtractor={(row) =>
                      satelliteRunIdFromRow(row) ||
                      JSON.stringify(row).slice(0, 48)
                    }
                    loading={runsLoading && satelliteRunsRows.length === 0}
                    emptyState={
                      <p className="c360-m-0 c360-text-sm">
                        No sessions in this view.
                      </p>
                    }
                  />
                </div>
                {satellitePaginationTotal > RUNS_PAGE_SIZE ? (
                  <Pagination
                    className="c360-hs-table-pagination"
                    page={satellitePage}
                    pageSize={RUNS_PAGE_SIZE}
                    total={satellitePaginationTotal}
                    onPageChange={setSatellitePage}
                  />
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <ConfirmModal
        isOpen={purgeConfirmOpen}
        onClose={() => setPurgeConfirmOpen(false)}
        title="Clear all scraper sessions?"
        variant="danger"
        confirmLabel="Clear all sessions"
        processing={purgeSessionsLoading}
        onConfirm={async () => {
          try {
            await onPurgeAllSessions();
            setPurgeConfirmOpen(false);
          } catch {
            /* toast handled in hook */
          }
        }}
      >
        <p className="c360-m-0 c360-text-sm">
          This will cancel all active scrapes, revoke queued worker tasks, and
          permanently remove every session row from{" "}
          <span className="c360-font-mono">scrape_data_index</span>.
        </p>
        <p className="c360-m-0 c360-mt-2 c360-text-sm c360-text-muted">
          Scraped LinkedIn job documents and tracked Postgres scrape jobs are
          not deleted.
        </p>
        {metricsTotal > 0 ? (
          <p className="c360-m-0 c360-mt-2 c360-text-2xs c360-text-muted">
            Current index: {metricsTotal.toLocaleString()} session
            {metricsTotal !== 1 ? "s" : ""}
            {metricsActive > 0
              ? ` (${metricsActive.toLocaleString()} active)`
              : ""}
            .
          </p>
        ) : null}
      </ConfirmModal>
    </div>
  );
}

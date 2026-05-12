"use client";

import { useEffect, useMemo, useState } from "react";
import { History, Play, RefreshCw } from "lucide-react";
import { Pagination } from "@/components/patterns/Pagination";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { Progress } from "@/components/ui/Progress";
import { cn, formatDate } from "@/lib/utils";
import {
  hireSignalRunCanCancel,
  hireSignalRunCanPause,
  hireSignalRunCanResume,
  useHireSignalRuns,
} from "@/hooks/useHireSignalRuns";
import {
  satelliteSessionProgressProps,
  scrapeStatusBadgeColor,
  satelliteRunIdFromRow,
  satelliteStatusFromRow,
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

  const {
    runsLoading,
    metrics,
    runActionId,
    cancelRunId,
    pauseRunId,
    resumeRunId,
    scrapeDownloadId,
    satelliteRunsRows,
    trackedScrapeRows,
    loadRuns,
    onRefreshRun,
    onCancelRun,
    onPauseRun,
    onResumeRun,
    onDownloadCsv,
  } = useHireSignalRuns("runs", {
    satellitePage: 1,
    runsPageSize: RUNS_PAGE_SIZE,
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

  const satellitePaged = useMemo(() => {
    const start = (satellitePage - 1) * RUNS_PAGE_SIZE;
    return filteredSatelliteRows.slice(start, start + RUNS_PAGE_SIZE);
  }, [filteredSatelliteRows, satellitePage]);

  const satelliteTotalFiltered = filteredSatelliteRows.length;

  useEffect(() => {
    const maxPage = Math.max(
      1,
      Math.ceil(satelliteTotalFiltered / RUNS_PAGE_SIZE),
    );
    if (satellitePage > maxPage) setSatellitePage(maxPage);
  }, [satelliteTotalFiltered, satellitePage]);

  const trackedPaged = useMemo(() => {
    const start = (trackedPage - 1) * RUNS_PAGE_SIZE;
    return trackedScrapeRows.slice(start, start + RUNS_PAGE_SIZE);
  }, [trackedScrapeRows, trackedPage]);

  const satelliteColumns: TableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: "runId",
        header: "Session / run ID",
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
        key: "status",
        header: "Status",
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
        render: (row) =>
          formatDate(
            String(
              row.startedAt ??
                row.started_at ??
                row.createdAt ??
                row.created_at ??
                "",
            ) || undefined,
          ),
      },
      {
        key: "finished",
        header: "Finished",
        render: (row) =>
          formatDate(
            String(
              row.finishedAt ??
                row.finished_at ??
                row.completedAt ??
                row.completed_at ??
                "",
            ) || undefined,
          ),
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
      runActionId,
      cancelRunId,
      pauseRunId,
      resumeRunId,
    ],
  );

  return (
    <div className="c360-flex c360-flex-col c360-gap-6 c360-px-4">
      <div className="c360-flex c360-flex-wrap c360-items-center c360-justify-between c360-gap-2">
        <div>
          <h2 className="c360-m-0 c360-text-sm c360-font-semibold c360-text-ink">
            Scraper sessions &amp; tracked jobs
          </h2>
          <p className="c360-m-0 c360-mt-1 c360-text-2xs c360-text-muted">
            Manage LinkedIn job scrapes (scraper.server). Interval repeats
            appear on each card.
          </p>
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
              <RefreshCw size={15} className={cn(runsLoading && "c360-spin")} />
            }
          >
            Reload
          </Button>
          {isSuperAdmin ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Play size={15} />}
              onClick={onOpenRunScrapeModal}
            >
              Run scrape
            </Button>
          ) : null}
        </div>
      </div>

      <QueueMetricsBar metrics={metrics} loading={runsLoading} />

      <section className="c360-space-y-3">
        <h3 className="c360-m-0 c360-text-2xs c360-font-semibold c360-uppercase c360-tracking-wide c360-text-muted">
          Your tracked scrapes (gateway)
        </h3>
        <div className="c360-grid c360-grid-cols-1 c360-gap-4 md:c360-grid-cols-2">
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
                    variant={satelliteFilter === "all" ? "primary" : "outline"}
                    onClick={() => {
                      setSatelliteFilter("all");
                      setSatellitePage(1);
                    }}
                  >
                    All
                  </Button>
                </div>
                <div className="c360-overflow-x-auto c360-rounded c360-border c360-border-ink-8">
                  <Table<Record<string, unknown>>
                    columns={satelliteColumns}
                    data={satellitePaged}
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
                {satelliteTotalFiltered > RUNS_PAGE_SIZE ? (
                  <Pagination
                    className="c360-hs-table-pagination"
                    page={satellitePage}
                    pageSize={RUNS_PAGE_SIZE}
                    total={satelliteTotalFiltered}
                    onPageChange={setSatellitePage}
                  />
                ) : null}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

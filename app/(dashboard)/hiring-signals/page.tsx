"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  History,
  RefreshCw,
  Play,
  List,
  LayoutGrid,
  LayoutDashboard,
  Zap,
} from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { Pagination } from "@/components/patterns/Pagination";
import { DataToolbar } from "@/components/patterns/DataToolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
import {
  useHiringSignals,
  type LinkedInJobRow,
} from "@/hooks/useHiringSignals";
import { useHireSignalRuns } from "@/hooks/useHireSignalRuns";
import {
  HireSignalFilterProvider,
  useHireSignalFilter,
} from "@/context/HireSignalFilterContext";
import { RunScrapeModal } from "@/components/feature/hiring-signals/RunScrapeModal";
import { HiringSignalStatsBar } from "@/components/feature/hiring-signals/HiringSignalStatsBar";
import { HiringSignalsFilterSidebar } from "@/components/feature/hiring-signals/HiringSignalsFilterSidebar";
import {
  HiringSignalsDataTable,
  HS_DT_DEFAULT_COLUMNS,
  type HiringSignalsDataTableColumnId,
} from "@/components/feature/hiring-signals/HiringSignalsDataTable";
import { JobDescriptionModal } from "@/components/feature/hiring-signals/JobDescriptionModal";
import { CompanyContactsModal } from "@/components/feature/hiring-signals/CompanyContactsModal";
import { JobConnectraModal } from "@/components/feature/hiring-signals/JobConnectraModal";
import { HiringSignalsDashboard } from "@/components/feature/hiring-signals/HiringSignalsDashboard";
import { CompanyDrawerPanel } from "@/components/feature/hiring-signals/CompanyDrawerPanel";
import { cn, formatDate } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/common/useBreakpoint";
import { isSuccessfulTerminalJobStatus } from "@/lib/jobs/jobsUtils";
import { parseOperationError } from "@/lib/errorParser";
import {
  exportSelectedHireSignalJobs,
  fetchHireSignalExportStatus,
} from "@/services/graphql/hiringSignalService";
import { Alert } from "@/components/ui/Alert";
import { toast } from "sonner";
import { useJobsDrawer } from "@/context/JobsDrawerContext";

const RUNS_PAGE_SIZE = 10;

function runStatusBadgeColor(status: string): BadgeColor {
  const s = status.toUpperCase();
  if (s.includes("SUCCESS") || s === "SUCCEEDED") return "success";
  if (s.includes("RUNNING") || s.includes("PENDING")) return "warning";
  if (
    s.includes("FAIL") ||
    s.includes("ERROR") ||
    s.includes("TIME") ||
    s.includes("ABORT")
  )
    return "danger";
  return "gray";
}

function satelliteRunId(row: Record<string, unknown>): string {
  return String(row.runId ?? row.run_id ?? row.id ?? "");
}

type HiringPageHiring = ReturnType<typeof useHiringSignals>;

type HiringSignalsPageBodyProps = {
  hiring: HiringPageHiring;
  signalTimePreset: "all" | "new_7d";
  setSignalTimePreset: (v: "all" | "new_7d") => void;
};

function HiringSignalsPageBody({
  hiring,
  signalTimePreset,
  setSignalTimePreset,
}: HiringSignalsPageBodyProps) {
  const { openJobsDrawer } = useJobsDrawer();
  const {
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
    refetch,
    currentPage,
  } = hiring;

  const { applyFilters, activeDraftCount } = useHireSignalFilter();
  const isDesktop = useIsDesktop();

  const [scrapeModalOpen, setScrapeModalOpen] = useState(false);
  const [jd, setJd] = useState<LinkedInJobRow | null>(null);
  const [companyRow, setCompanyRow] = useState<LinkedInJobRow | null>(null);
  const [connectraRow, setConnectraRow] = useState<LinkedInJobRow | null>(null);
  const [drawerRow, setDrawerRow] = useState<LinkedInJobRow | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [mainTab, setMainTab] = useState<"overview" | "signals" | "runs">(
    "signals",
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [tableDensity, setTableDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );
  const [visibleColumns, setVisibleColumns] = useState<
    HiringSignalsDataTableColumnId[]
  >([...HS_DT_DEFAULT_COLUMNS]);
  const [satellitePage, setSatellitePage] = useState(1);
  const [trackedPage, setTrackedPage] = useState(1);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportBanner, setExportBanner] = useState<{
    jobId: string;
    status: string;
  } | null>(null);

  const {
    runsLoading,
    runActionId,
    scrapeDownloadId,
    satelliteRunsRows,
    satelliteRunsTotal,
    trackedScrapeRows,
    loadRuns,
    onRefreshRun,
    onDownloadCsv,
  } = useHireSignalRuns(mainTab, {
    satellitePage,
    runsPageSize: RUNS_PAGE_SIZE,
  });

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(satelliteRunsTotal / RUNS_PAGE_SIZE));
    if (satellitePage > maxPage) setSatellitePage(maxPage);
  }, [satelliteRunsTotal, satellitePage]);

  useEffect(() => {
    setTrackedPage(1);
  }, [trackedScrapeRows.length]);

  const previewJobsForDrawer = useMemo(() => {
    if (!drawerRow?.companyUuid) return [];
    const u = drawerRow.companyUuid;
    return jobs.filter((j) => j.companyUuid === u);
  }, [drawerRow, jobs]);

  const latestSatelliteRun = satelliteRunsRows[0];

  const drillSignalsByRun = useCallback(
    (runId: string) => {
      const id = runId.trim();
      if (!id) return;
      setFilters((f) => ({ ...f, runId: id, offset: 0 }));
      setMainTab("signals");
    },
    [setFilters],
  );

  const clearRunFilter = useCallback(() => {
    setFilters((f) => ({ ...f, runId: undefined, offset: 0 }));
  }, [setFilters]);

  const toggleHsColumn = useCallback(
    (id: HiringSignalsDataTableColumnId, visible: boolean) => {
      setVisibleColumns((prev) => {
        const s = new Set(prev);
        if (visible) s.add(id);
        else s.delete(id);
        const arr = [...s] as HiringSignalsDataTableColumnId[];
        if (arr.length === 0) return [...HS_DT_DEFAULT_COLUMNS];
        return arr;
      });
    },
    [],
  );

  const onExportSelected = useCallback(
    async (linkedinJobIds: string[]) => {
      setExportBusy(true);
      try {
        const res = await exportSelectedHireSignalJobs(linkedinJobIds);
        const row = res.hireSignal?.exportSelectedJobs;
        if (!row?.jobId) {
          toast.error("Export was queued but no job id was returned.");
          return;
        }
        setExportBanner({ jobId: row.jobId, status: row.status || "OPEN" });
        toast.success("XLSX export queued", {
          description:
            "Track progress on Jobs (filter: Hiring Signals) — download when complete.",
          action: {
            label: "Open Jobs",
            onClick: () => openJobsDrawer({ jobFamily: "hire_signal" }),
          },
        });
      } catch (e) {
        toast.error(parseOperationError(e, "jobs").userMessage);
      } finally {
        setExportBusy(false);
      }
    },
    [openJobsDrawer],
  );

  useEffect(() => {
    if (!exportBanner?.jobId) return;
    const st = exportBanner.status || "";
    const done =
      st.toUpperCase() === "FAILED" || isSuccessfulTerminalJobStatus(st);
    if (done) return;

    let cancelled = false;
    const id = setInterval(() => {
      void (async () => {
        try {
          const data = await fetchHireSignalExportStatus(exportBanner.jobId);
          const next = data.hireSignal?.exportJobStatus?.status;
          if (!cancelled && next) {
            setExportBanner((b) =>
              b && b.jobId === exportBanner.jobId
                ? { jobId: b.jobId, status: next }
                : b,
            );
          }
        } catch {
          /* polling is best-effort */
        }
      })();
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [exportBanner?.jobId, exportBanner?.status]);

  const renderStatsBar = () => (
    <HiringSignalStatsBar
      totalJobs={stats.totalJobs}
      jobsWithCompany={stats.jobsWithCompany}
      filterMatchTotal={total}
      pageRowCount={jobs.length}
      loading={statsLoading}
      className="c360-mb-4"
    />
  );

  const trackedPaged = useMemo(() => {
    const start = (trackedPage - 1) * RUNS_PAGE_SIZE;
    return trackedScrapeRows.slice(start, start + RUNS_PAGE_SIZE);
  }, [trackedScrapeRows, trackedPage]);

  const satelliteColumns: TableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: "runId",
        header: "Run ID",
        render: (row) => {
          const full = satelliteRunId(row);
          const short = full.length > 14 ? `${full.slice(0, 14)}…` : full;
          return (
            <Tooltip content={full || "—"} placement="top">
              <span className="c360-font-mono c360-text-2xs">
                {short || "—"}
              </span>
            </Tooltip>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        render: (row) => {
          const st = String(row.status ?? "—");
          return (
            <Badge color={runStatusBadgeColor(st)} size="sm">
              {st}
            </Badge>
          );
        },
      },
      {
        key: "items",
        header: "Items",
        align: "right",
        render: (row) => (
          <span>{String(row.itemCount ?? row.item_count ?? "—")}</span>
        ),
      },
      {
        key: "started",
        header: "Started",
        render: (row) =>
          formatDate(
            String(row.startedAt ?? row.started_at ?? "") || undefined,
          ),
      },
      {
        key: "finished",
        header: "Finished",
        render: (row) =>
          formatDate(
            String(row.finishedAt ?? row.finished_at ?? "") || undefined,
          ),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (row) => {
          const rid = satelliteRunId(row);
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
              {rid ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={runActionId === rid}
                  onClick={() => void onRefreshRun(rid)}
                >
                  {runActionId === rid ? "Refreshing…" : "Refresh"}
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [drillSignalsByRun, onRefreshRun, runActionId],
  );

  const trackedColumns: TableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: "id",
        header: "Scrape job",
        render: (row) => {
          const full = String(row.id ?? "");
          const short =
            full.length > 12 ? `${full.slice(0, 12)}…` : full || "—";
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
          const st = String(row.status ?? "—");
          return (
            <Badge color={runStatusBadgeColor(st)} size="sm">
              {st}
            </Badge>
          );
        },
      },
      {
        key: "apify",
        header: "Apify run",
        render: (row) => {
          const full = String(row.apifyRunId ?? "");
          const short =
            full.length > 12 ? `${full.slice(0, 12)}…` : full || "—";
          return (
            <Tooltip content={full || "—"} placement="top">
              <span className="c360-font-mono c360-text-2xs">{short}</span>
            </Tooltip>
          );
        },
      },
      {
        key: "created",
        header: "Created",
        render: (row) => formatDate(String(row.createdAt ?? "") || undefined),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (row) => {
          const sid = String(row.id ?? "");
          const apify = String(row.apifyRunId ?? "");
          return (
            <div className="c360-flex c360-flex-wrap c360-items-center c360-justify-end c360-gap-1">
              {apify ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => drillSignalsByRun(apify)}
                >
                  Signals
                </Button>
              ) : null}
              {sid ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={scrapeDownloadId === sid || !apify}
                  onClick={() => void onDownloadCsv(sid)}
                >
                  {scrapeDownloadId === sid ? "Exporting…" : "CSV"}
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [drillSignalsByRun, onDownloadCsv, scrapeDownloadId],
  );

  const signalsToolbar = (
    <DataToolbar
      cssPrefix="c360-toolbar"
      tabs={[
        {
          value: "all",
          label: "All signals",
          count: total,
          showCountOnlyWhenActive: true,
        },
        {
          value: "new",
          label: "New (7 days)",
          count: total,
          showCountOnlyWhenActive: true,
        },
      ]}
      activeTab={signalTimePreset === "new_7d" ? "new" : "all"}
      onTabChange={(v) => setSignalTimePreset(v === "new" ? "new_7d" : "all")}
      totalCount={total}
      viewModes={[
        { value: "comfortable", label: "Comfortable", icon: LayoutGrid },
        { value: "compact", label: "Compact", icon: List },
      ]}
      viewMode={tableDensity}
      onViewModeChange={(m) => setTableDensity(m as "comfortable" | "compact")}
      filterConfig={{
        activeCount: activeDraftCount,
        onOpen: () => setMobileFiltersOpen(true),
        show: !isDesktop,
      }}
      actions={[
        {
          label: "Refresh",
          onClick: () => void refetch(),
          icon: RefreshCw,
          variant: "secondary",
          disabled: loading,
        },
        {
          label: "Run scrape",
          onClick: () => setScrapeModalOpen(true),
          icon: Play,
          variant: "primary",
        },
      ]}
    />
  );

  return (
    <DashboardPageLayout>
      {error ? (
        <p className="c360-mb-4 c360-text-sm c360-text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <Tabs
        value={mainTab}
        onValueChange={(v) => setMainTab(v as "overview" | "signals" | "runs")}
        variant="dashboard"
        className="c360-mb-4"
      >
        <TabsList>
          <TabsTrigger value="overview" icon={<LayoutDashboard size={14} />}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="signals" icon={<Zap size={14} />}>
            Signals
          </TabsTrigger>
          <TabsTrigger value="runs" icon={<History size={14} />}>
            Runs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <HiringSignalsDashboard
            jobs={jobs}
            loading={loading}
            statsBar={renderStatsBar()}
            onOpenCompanyDrawer={(row) => setDrawerRow(row)}
            latestRun={latestSatelliteRun}
            runsLoading={runsLoading}
            onGoToRuns={() => setMainTab("runs")}
          />
        </TabsContent>
        <TabsContent value="runs">
          <div
            className="c360-flex c360-flex-col c360-gap-6"
            style={{ paddingLeft: "16px", paddingRight: "16px" }}
          >
            <div className="c360-flex c360-flex-wrap c360-items-center c360-justify-between c360-gap-2">
              <h2 className="c360-m-0 c360-text-sm c360-font-semibold c360-text-ink">
                Job.server runs &amp; your scrape history
              </h2>
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
            </div>

            <section>
              <h3 className="c360-mb-2 c360-text-2xs c360-font-semibold c360-uppercase c360-tracking-wide c360-text-muted">
                Recent Apify runs (satellite)
              </h3>
              <div className="c360-overflow-x-auto c360-rounded c360-border c360-border-ink-8">
                <Table<Record<string, unknown>>
                  columns={satelliteColumns}
                  data={satelliteRunsRows}
                  keyExtractor={(row) =>
                    satelliteRunId(row) || JSON.stringify(row).slice(0, 48)
                  }
                  loading={runsLoading && satelliteRunsRows.length === 0}
                  emptyState={
                    <p className="c360-m-0 c360-text-sm">No runs yet.</p>
                  }
                />
              </div>
              {satelliteRunsTotal > RUNS_PAGE_SIZE ? (
                <Pagination
                  className="c360-hs-table-pagination"
                  page={satellitePage}
                  pageSize={RUNS_PAGE_SIZE}
                  total={satelliteRunsTotal}
                  onPageChange={setSatellitePage}
                />
              ) : null}
            </section>

            <section>
              <h3 className="c360-mb-2 c360-text-2xs c360-font-semibold c360-uppercase c360-tracking-wide c360-text-muted">
                Your tracked scrapes (gateway)
              </h3>
              <div className="c360-overflow-x-auto c360-rounded c360-border c360-border-ink-8">
                <Table<Record<string, unknown>>
                  columns={trackedColumns}
                  data={trackedPaged}
                  keyExtractor={(row) => String(row.id ?? JSON.stringify(row))}
                  loading={runsLoading && trackedScrapeRows.length === 0}
                  emptyState={
                    <p className="c360-m-0 c360-text-sm">
                      No tracked scrapes yet. Use <strong>Run scrape</strong> to
                      queue one.
                    </p>
                  }
                />
              </div>
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
          </div>
        </TabsContent>
        <TabsContent value="signals">
          <DataPageLayout
            showFilters
            mobileFiltersOpen={mobileFiltersOpen}
            onMobileFiltersClose={() => setMobileFiltersOpen(false)}
            toolbar={signalsToolbar}
            filters={
              <HiringSignalsFilterSidebar
                onApply={() => {
                  applyFilters();
                  setMobileFiltersOpen(false);
                }}
                appliedRunId={filters.runId}
                onClearRunId={clearRunFilter}
              />
            }
            metadata={
              <p className="c360-text-2xs c360-text-ink-muted">
                {loading
                  ? "Loading…"
                  : `Showing ${jobs.length} of ${total.toLocaleString()} match(es). Filters apply on “Apply”.`}
              </p>
            }
            pagination={
              total > filters.limit ? (
                <Pagination
                  className="c360-mt-4 c360-justify-end"
                  page={currentPage + 1}
                  pageSize={filters.limit}
                  total={total}
                  onPageChange={(p) => setPage(p - 1)}
                />
              ) : null
            }
          >
            <div className="c360-mb-2">
              <h2 className="c360-text-sm c360-font-semibold c360-text-ink">
                Open roles
              </h2>
              <p className="c360-mt-1 c360-text-2xs c360-text-ink-muted">
                Server-paginated list; set filters in the left column, then
                Apply.
              </p>
            </div>
            {exportBanner ? (
              <Alert
                variant={
                  exportBanner.status.toUpperCase() === "FAILED"
                    ? "danger"
                    : isSuccessfulTerminalJobStatus(exportBanner.status)
                      ? "success"
                      : "info"
                }
                title="Latest XLSX export"
                className="c360-mb-3"
                onClose={() => setExportBanner(null)}
              >
                <p className="c360-m-0 c360-text-sm">
                  Job{" "}
                  <span className="c360-font-mono c360-text-2xs">
                    {exportBanner.jobId.length > 20
                      ? `${exportBanner.jobId.slice(0, 10)}…${exportBanner.jobId.slice(-6)}`
                      : exportBanner.jobId}
                  </span>{" "}
                  — status{" "}
                  <strong className="c360-font-medium">
                    {exportBanner.status}
                  </strong>
                  .{" "}
                  <button
                    type="button"
                    className="c360-inline c360-border-0 c360-bg-transparent c360-p-0 c360-text-primary c360-underline"
                    onClick={() => openJobsDrawer({ jobFamily: "hire_signal" })}
                  >
                    Open Jobs
                  </button>{" "}
                  to download when complete.
                </p>
              </Alert>
            ) : null}
            <HiringSignalsDataTable
              rows={jobs}
              loading={loading}
              pageSize={filters.limit}
              onPageSizeChange={setPageSize}
              onOpenDescription={setJd}
              onOpenCompany={setCompanyRow}
              onOpenConnectra={setConnectraRow}
              onOpenCompanyDrawer={(row) => setDrawerRow(row)}
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
              density={tableDensity}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleHsColumn}
              onExportSelected={onExportSelected}
              exportBusy={exportBusy}
            />
          </DataPageLayout>
        </TabsContent>
      </Tabs>

      <JobDescriptionModal job={jd} isOpen={!!jd} onClose={() => setJd(null)} />
      {companyRow?.companyUuid ? (
        <CompanyContactsModal
          companyUuid={companyRow.companyUuid}
          companyName={companyRow.companyName || "Company"}
          isOpen={!!companyRow}
          onClose={() => setCompanyRow(null)}
        />
      ) : null}
      {connectraRow ? (
        <JobConnectraModal
          job={connectraRow}
          isOpen={!!connectraRow}
          onClose={() => setConnectraRow(null)}
        />
      ) : null}

      <CompanyDrawerPanel
        anchor={drawerRow}
        previewJobs={previewJobsForDrawer}
        isOpen={!!drawerRow}
        onClose={() => setDrawerRow(null)}
      />

      <RunScrapeModal
        isOpen={scrapeModalOpen}
        onClose={() => setScrapeModalOpen(false)}
        onSuccess={() => {
          void refetch();
          void loadRuns();
        }}
      />
    </DashboardPageLayout>
  );
}

export default function HiringSignalsPage() {
  const [signalTimePreset, setSignalTimePreset] = useState<"all" | "new_7d">(
    "all",
  );
  const hiring = useHiringSignals({}, { signalTimePreset });

  return (
    <HireSignalFilterProvider setFilters={hiring.setFilters}>
      <HiringSignalsPageBody
        hiring={hiring}
        signalTimePreset={signalTimePreset}
        setSignalTimePreset={setSignalTimePreset}
      />
    </HireSignalFilterProvider>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EMPTY_HIRING_SIGNAL_DRAFT } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import type { HiringSignalFilterDraft } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import { useSearchParams } from "next/navigation";
import { FilterX, History, Zap } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { STORAGE_KEYS } from "@/lib/constants";
import { HiringSignalsListToolbar } from "@/components/feature/hiring-signals/HiringSignalsListToolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  effectivePostedBounds,
  useHiringSignals,
  type LinkedInJobRow,
} from "@/hooks/useHiringSignals";
import {
  HireSignalFilterProvider,
  useHireSignalFilter,
} from "@/context/HireSignalFilterContext";
import { RunScrapeModal } from "@/components/feature/hiring-signals/RunScrapeModal";
import { RunsTab } from "@/components/feature/hiring-signals/RunsTab";
import { HiringSignalsFilterSidebar } from "@/components/feature/hiring-signals/HiringSignalsFilterSidebar";
import {
  HiringSignalsDataTable,
  HS_DT_COLUMN_IDS,
  HS_DT_DEFAULT_COLUMNS,
  type HiringSignalsDataTableColumnId,
} from "@/components/feature/hiring-signals/HiringSignalsDataTable";
import {
  HiringSignalsExportModal,
  type HiringSignalsExportIntent,
} from "@/components/feature/hiring-signals/HiringSignalsExportModal";
import { JobDescriptionModal } from "@/components/feature/hiring-signals/JobDescriptionModal";
import { CompanyContactsModal } from "@/components/feature/hiring-signals/CompanyContactsModal";
import { JobConnectraModal } from "@/components/feature/hiring-signals/JobConnectraModal";
import { CompanyDrawerPanel } from "@/components/feature/hiring-signals/CompanyDrawerPanel";
import { HiringSignalsTourPrepare } from "@/components/feature/hiring-signals/HiringSignalsTourPrepare";
import { companyDrawerAnchorFromJob } from "@/lib/companyDrawerAnchor";
import { cn } from "@/lib/utils";
import {
  deriveDisplayProgressPercent,
  isSuccessfulTerminalJobStatus,
} from "@/lib/jobs/jobsUtils";
import { parseStatusPayload } from "@/lib/jobs/statusPayload";
import { parseOperationError } from "@/lib/errorParser";
import {
  coerceJobListSortFields,
  exportSelectedHireSignalJobs,
  fetchHireSignalExportStatus,
  fetchLinkedinJobIdsAllMatching,
  fetchLinkedinJobIdsFirstN,
  HS_EXPORT_MAX_IDS_NON_STAFF,
  HS_EXPORT_MAX_IDS_STAFF,
  type JobListFilters,
} from "@/services/graphql/hiringSignalService";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { toast } from "sonner";
import { useJobsDrawer } from "@/context/JobsDrawerContext";
import { EXPORT_DRAWER_DISPLAY_NAME } from "@/lib/jobs/exportDrawerUi";
import { useRole } from "@/context/RoleContext";
import {
  SavedSearchesMenu,
  SavedSearchesTriggerButton,
} from "@/components/feature/saved-searches/SavedSearchesMenu";
import {
  HIRE_SIGNAL_SAVED_SEARCH_VERSION,
  type HireSignalSavedSearchPayload,
} from "@/lib/savedSearchPayload";

const HS_VISIBLE_COLUMNS_STORAGE_KEY = "c360:hiringSignals:visibleColumns:v1";

function loadHireSignalVisibleColumns(): HiringSignalsDataTableColumnId[] {
  if (typeof window === "undefined") return [...HS_DT_DEFAULT_COLUMNS];
  try {
    const raw = localStorage.getItem(HS_VISIBLE_COLUMNS_STORAGE_KEY);
    if (!raw) return [...HS_DT_DEFAULT_COLUMNS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...HS_DT_DEFAULT_COLUMNS];
    const ordered = HS_DT_COLUMN_IDS.filter((id) => parsed.includes(id));
    return ordered.length > 0 ? ordered : [...HS_DT_DEFAULT_COLUMNS];
  } catch {
    return [...HS_DT_DEFAULT_COLUMNS];
  }
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
    loading,
    error,
    filters,
    setFilters,
    setPage,
    setPageSize,
    refetch,
    currentPage,
    companyCohortResolving,
    companyCohortMatchTotal,
    companyCohortTruncated,
  } = hiring;

  const { resetFilters } = useHireSignalFilter();
  const { isAdmin, isSuperAdmin } = useRole();
  const canExportHireSignalXlsx = isAdmin || isSuperAdmin;
  /** Runs tab — admin + superadmin; scrape queueing is super-admin only (toolbar + modal). */
  const showRunsTab = isAdmin;
  /** Tab strip only when Runs is available (Signals is always the default view). */
  const showTabList = showRunsTab;

  const searchParams = useSearchParams();
  const [scrapeModalOpen, setScrapeModalOpen] = useState(false);
  const [jd, setJd] = useState<LinkedInJobRow | null>(null);
  const [companyRow, setCompanyRow] = useState<LinkedInJobRow | null>(null);
  const [connectraRow, setConnectraRow] = useState<LinkedInJobRow | null>(null);
  const [drawerRow, setDrawerRow] = useState<LinkedInJobRow | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<
    HiringSignalsDataTableColumnId[]
  >(() => [...HS_DT_DEFAULT_COLUMNS]);
  const [mainTab, setMainTab] = useState<"signals" | "runs">("signals");
  const [runsReloadTick, setRunsReloadTick] = useState(0);
  const [savedSearchesPanelOpen, setSavedSearchesPanelOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportBanner, setExportBanner] = useState<{
    jobId: string;
    status: string;
    /** 0–100 from job.server ``progress_percent`` + ``deriveDisplayProgressPercent`` */
    progress: number;
  } | null>(null);

  const previewJobsForDrawer = useMemo(() => {
    if (!drawerRow?.companyUuid) return [];
    const u = drawerRow.companyUuid;
    return jobs.filter((j) => j.companyUuid === u);
  }, [drawerRow, jobs]);

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

  const handleGridColumnVisibilityResolved = useCallback(
    (cols: HiringSignalsDataTableColumnId[]) => {
      setVisibleColumns(cols);
      try {
        localStorage.setItem(
          HS_VISIBLE_COLUMNS_STORAGE_KEY,
          JSON.stringify(cols),
        );
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const getHireSignalSavedPayload =
    useCallback((): HireSignalSavedSearchPayload => {
      return {
        version: HIRE_SIGNAL_SAVED_SEARCH_VERSION,
        listFilters: structuredClone(filters),
        signalTimePreset,
      };
    }, [filters, signalTimePreset]);

  const handleApplyHireSignalSaved = useCallback(
    (p: HireSignalSavedSearchPayload) => {
      setSignalTimePreset(p.signalTimePreset);
      const lf = p.listFilters as JobListFilters & {
        listSort?: "recent" | "oldest";
      };
      setFilters({
        ...lf,
        ...coerceJobListSortFields(lf),
        offset: 0,
      });
    },
    [setFilters, setSignalTimePreset],
  );

  const hireSignalSavedSearchMenuProps = useMemo(
    () => ({
      entity: "hire_signal" as const,
      getHireSignalPayload: getHireSignalSavedPayload,
      onApplyHireSignal: handleApplyHireSignalSaved,
      presentation: "panel" as const,
      panelOpen: savedSearchesPanelOpen,
      onPanelOpenChange: setSavedSearchesPanelOpen,
      showTrigger: false,
    }),
    [
      getHireSignalSavedPayload,
      handleApplyHireSignalSaved,
      savedSearchesPanelOpen,
    ],
  );

  const openSavedSearchesPanel = useCallback(() => {
    setSavedSearchesPanelOpen(true);
  }, []);

  const openConnectraForTour = useCallback(() => {
    const row =
      jobs.find((j) => j.companyUuid?.trim()) ??
      jobs.find((j) => j.linkedinJobId?.trim()) ??
      jobs[0];
    if (row) setConnectraRow(row);
  }, [jobs]);

  const savedSearchesTrigger = useMemo(
    () => <SavedSearchesTriggerButton onClick={openSavedSearchesPanel} />,
    [openSavedSearchesPanel],
  );

  const hireSignalFiltersPinExtra = useMemo(
    () => (
      <>
        {savedSearchesTrigger}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<FilterX size={14} aria-hidden />}
          onClick={resetFilters}
        >
          Clear
        </Button>
      </>
    ),
    [savedSearchesTrigger, resetFilters],
  );

  const effectiveJobListFilters = useMemo(() => {
    const bounds = effectivePostedBounds(signalTimePreset, {
      postedAfter: filters.postedAfter,
      postedBefore: filters.postedBefore,
    });
    return {
      ...filters,
      postedAfter: bounds.postedAfter,
      postedBefore: bounds.postedBefore,
      companyUuids: filters.companyUuids,
    };
  }, [filters, signalTimePreset]);

  const hireSignalExportIdCap = useMemo(
    () =>
      isAdmin || isSuperAdmin
        ? HS_EXPORT_MAX_IDS_STAFF
        : HS_EXPORT_MAX_IDS_NON_STAFF,
    [isAdmin, isSuperAdmin],
  );

  const queueHireSignalXlsxExport = useCallback(
    async (linkedinJobIds: string[]) => {
      const res = await exportSelectedHireSignalJobs(linkedinJobIds);
      const row = res.hireSignal?.exportSelectedJobs;
      if (!row?.jobId) {
        toast.error("Export was queued but no job id was returned.");
        return;
      }
      const st0 = (row.status || "OPEN").trim();
      const parsed0 = parseStatusPayload(row.statusPayload);
      const rawPct0 =
        row.statusPayload &&
        typeof row.statusPayload === "object" &&
        typeof (row.statusPayload as Record<string, unknown>)
          .progress_percent === "number"
          ? ((row.statusPayload as Record<string, unknown>)
              .progress_percent as number)
          : null;
      const prog0 =
        rawPct0 != null && rawPct0 > 0
          ? Math.min(100, Math.max(0, Math.round(rawPct0)))
          : deriveDisplayProgressPercent(st0.toUpperCase(), {
              progress: parsed0.progress,
              total: parsed0.total,
              processed: parsed0.processed,
            });
      setExportBanner({
        jobId: row.jobId,
        status: st0,
        progress: prog0,
      });
      toast.success("XLSX export queued", {
        description: `Track progress on ${EXPORT_DRAWER_DISPLAY_NAME} (filter: Hiring Signals) — download when complete.`,
        action: {
          label: `Open ${EXPORT_DRAWER_DISPLAY_NAME}`,
          onClick: () => openJobsDrawer({ jobFamily: "hire_signal" }),
        },
      });
    },
    [openJobsDrawer],
  );

  const handleExportIntent = useCallback(
    async (intent: HiringSignalsExportIntent) => {
      if (!canExportHireSignalXlsx) {
        toast.message("Coming soon", {
          description:
            "XLSX export is available for admin accounts. Contact your admin or view plans.",
        });
        return;
      }
      setExportBusy(true);
      try {
        let linkedinJobIds: string[] = [];
        const cap = hireSignalExportIdCap;
        if (intent.scope === "selected") {
          const raw = intent.linkedinJobIds;
          linkedinJobIds = raw.slice(0, cap);
          if (raw.length > cap) {
            toast.message("Export limited", {
              description: `Including ${cap.toLocaleString()} of ${raw.length.toLocaleString()} selected jobs (account limit).`,
            });
          }
        } else if (intent.scope === "first_n") {
          const n = Math.min(Math.max(1, Math.floor(intent.n)), cap);
          if (intent.n > cap) {
            toast.message("Export limited", {
              description: `N is capped at ${cap.toLocaleString()} for your account.`,
            });
          }
          linkedinJobIds = await fetchLinkedinJobIdsFirstN(
            effectiveJobListFilters,
            n,
          );
        } else {
          const r = await fetchLinkedinJobIdsAllMatching(
            effectiveJobListFilters,
            cap,
          );
          linkedinJobIds = r.ids;
          if (r.truncated) {
            toast.message("Large export", {
              description:
                isAdmin || isSuperAdmin
                  ? `Including ${linkedinJobIds.length.toLocaleString()} of ${r.totalMatching.toLocaleString()} matching rows.`
                  : `Including ${linkedinJobIds.length.toLocaleString()} of ${r.totalMatching.toLocaleString()} matching rows (account cap ${cap.toLocaleString()}). Narrow filters or export in batches.`,
            });
          }
        }
        if (linkedinJobIds.length === 0) {
          toast.error("Nothing to export.");
          return;
        }
        await queueHireSignalXlsxExport(linkedinJobIds);
        setExportModalOpen(false);
      } catch (e) {
        toast.error(parseOperationError(e, "jobs").userMessage);
      } finally {
        setExportBusy(false);
      }
    },
    [
      canExportHireSignalXlsx,
      effectiveJobListFilters,
      hireSignalExportIdCap,
      isAdmin,
      isSuperAdmin,
      queueHireSignalXlsxExport,
    ],
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
          const row = data.hireSignal?.exportJobStatus;
          if (!cancelled && row?.status) {
            const st = row.status.trim();
            const parsed = parseStatusPayload(row.statusPayload);
            const rawPct =
              row.statusPayload &&
              typeof row.statusPayload === "object" &&
              typeof (row.statusPayload as Record<string, unknown>)
                .progress_percent === "number"
                ? ((row.statusPayload as Record<string, unknown>)
                    .progress_percent as number)
                : null;
            const prog =
              rawPct != null && rawPct > 0
                ? Math.min(100, Math.max(0, Math.round(rawPct)))
                : deriveDisplayProgressPercent(st.toUpperCase(), {
                    progress: parsed.progress,
                    total: parsed.total,
                    processed: parsed.processed,
                  });
            setExportBanner((b) =>
              b && b.jobId === exportBanner.jobId
                ? { jobId: b.jobId, status: st, progress: prog }
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

  useEffect(() => {
    if (!showRunsTab && mainTab === "runs") setMainTab("signals");
  }, [showRunsTab, mainTab]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "runs" && showRunsTab) setMainTab("runs");
  }, [searchParams, showRunsTab]);

  useEffect(() => {
    setVisibleColumns(loadHireSignalVisibleColumns());
  }, []);

  const signalsToolbar = (
    <HiringSignalsListToolbar
      globalSearchTokens={filters.globalSearchTokens}
      runId={filters.runId}
      loading={loading}
      total={total}
      pageSize={filters.limit}
      currentPage={currentPage}
      signalTimePreset={signalTimePreset}
      canExportHireSignalXlsx={canExportHireSignalXlsx}
      isSuperAdmin={isSuperAdmin}
      onGlobalSearchTokensChange={(next) => {
        setFilters((f) => ({
          ...f,
          globalSearchTokens: next.length > 0 ? next : undefined,
          offset: 0,
        }));
      }}
      onSignalTimePresetChange={setSignalTimePreset}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      onExportClick={() => setExportModalOpen(true)}
      onRefresh={() => void refetch()}
      onRunScrapeClick={() => setScrapeModalOpen(true)}
    />
  );

  return (
    <DashboardPageLayout
      className="c360-dashboard-layout--hiring-signals"
      data-tour="hs-page"
    >
      {error ? (
        <p className="c360-mb-4 c360-text-sm c360-text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <Tabs
        value={showTabList ? mainTab : "signals"}
        onValueChange={
          showTabList ? (v) => setMainTab(v as "signals" | "runs") : undefined
        }
        variant={showTabList ? "floating" : "dashboard"}
        className={cn(
          "c360-tabs--hiring-signals",
          showTabList && "c360-tabs--floating-bottom",
        )}
      >
        {showTabList ? (
          <TabsList>
            <TabsTrigger value="signals" icon={<Zap size={16} />}>
              Signals
            </TabsTrigger>
            <TabsTrigger value="runs" icon={<History size={16} />}>
              Runs
            </TabsTrigger>
          </TabsList>
        ) : null}
        {showRunsTab ? (
          <TabsContent value="runs" className="c360-hs-runs-tab-panel">
            <RunsTab
              isAdmin={isAdmin}
              isSuperAdmin={isSuperAdmin}
              onOpenRunScrapeModal={() => setScrapeModalOpen(true)}
              drillSignalsByRun={drillSignalsByRun}
              reloadTick={runsReloadTick}
            />
          </TabsContent>
        ) : null}
        <TabsContent value="signals">
          <DataPageLayout
            className="c360-hiring-signals-page"
            showFilters
            filtersPanelStorageKey={
              STORAGE_KEYS.DATA_FILTERS_PEEK_PINNED_HIRING_SIGNALS
            }
            filtersAriaLabel="Hiring signal filters"
            toolbar={signalsToolbar}
            filters={
              <HiringSignalsFilterSidebar
                headerActions={hireSignalFiltersPinExtra}
                appliedListFilters={effectiveJobListFilters}
                signalTimePreset={signalTimePreset}
                appliedRunId={filters.runId}
                runScopedJobTotal={filters.runId?.trim() ? total : undefined}
                onClearRunId={clearRunFilter}
                companyCohortResolving={companyCohortResolving}
                companyCohortMatchTotal={companyCohortMatchTotal}
                companyCohortTruncated={companyCohortTruncated}
              />
            }
          >
            <div className="c360-hs-signals-body">
              <HiringSignalsTourPrepare
                onOpenSavedSearches={() => {
                  setConnectraRow(null);
                  openSavedSearchesPanel();
                }}
                onOpenConnectraForTour={openConnectraForTour}
                onClosePanels={() => {
                  setConnectraRow(null);
                  setSavedSearchesPanelOpen(false);
                }}
              />
              <SavedSearchesMenu {...hireSignalSavedSearchMenuProps} />
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
                  <div className="c360-flex c360-flex-col c360-gap-2">
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
                        onClick={() =>
                          openJobsDrawer({ jobFamily: "hire_signal" })
                        }
                      >
                        Open {EXPORT_DRAWER_DISPLAY_NAME}
                      </button>{" "}
                      to download when complete.
                    </p>
                    {!isSuccessfulTerminalJobStatus(exportBanner.status) &&
                    exportBanner.status.toUpperCase() !== "FAILED" ? (
                      <Progress
                        value={exportBanner.progress}
                        max={100}
                        size="sm"
                        color="primary"
                        label="Export progress"
                        showValue
                        indeterminate={
                          exportBanner.progress <= 0 &&
                          !["FAILED", "CANCELLED", "CANCELED"].includes(
                            exportBanner.status.toUpperCase(),
                          )
                        }
                      />
                    ) : null}
                  </div>
                </Alert>
              ) : null}
              <HiringSignalsDataTable
                rows={jobs}
                loading={loading}
                onOpenDescription={setJd}
                onOpenCompany={setCompanyRow}
                onOpenConnectra={setConnectraRow}
                onOpenCompanyDrawer={(row) => setDrawerRow(row)}
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                visibleColumns={visibleColumns}
                listFilters={effectiveJobListFilters}
                setListFilters={setFilters}
                totalRowCount={total}
                onColumnVisibilityResolved={handleGridColumnVisibilityResolved}
                todaysJobsTab={signalTimePreset === "new_7d"}
                onViewAllSignals={() => setSignalTimePreset("all")}
                onClearPostedRange={() =>
                  setFilters((f) => ({
                    ...f,
                    postedAfter: undefined,
                    postedBefore: undefined,
                    offset: 0,
                  }))
                }
              />
            </div>
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
        anchor={drawerRow ? companyDrawerAnchorFromJob(drawerRow) : null}
        previewJobs={previewJobsForDrawer}
        isOpen={!!drawerRow}
        onClose={() => setDrawerRow(null)}
      />

      {canExportHireSignalXlsx ? (
        <HiringSignalsExportModal
          isOpen={exportModalOpen}
          onClose={() => !exportBusy && setExportModalOpen(false)}
          jobs={jobs}
          totalMatching={total}
          selectedKeys={selectedKeys}
          defaultFirstN={filters.limit}
          maxExportJobIds={hireSignalExportIdCap}
          staffExport={isAdmin || isSuperAdmin}
          busy={exportBusy}
          onConfirm={(intent) => void handleExportIntent(intent)}
        />
      ) : null}

      {isSuperAdmin ? (
        <RunScrapeModal
          isOpen={scrapeModalOpen}
          onClose={() => setScrapeModalOpen(false)}
          onSuccess={() => {
            void refetch();
            setRunsReloadTick((t) => t + 1);
          }}
        />
      ) : null}
    </DashboardPageLayout>
  );
}

export default function HiringSignalsPageClient() {
  const [signalTimePreset, setSignalTimePreset] = useState<"all" | "new_7d">(
    "all",
  );
  const companyCohortDraftRef = useRef<HiringSignalFilterDraft>(
    EMPTY_HIRING_SIGNAL_DRAFT,
  );
  const hiring = useHiringSignals(
    {},
    { signalTimePreset, companyCohortDraftRef },
  );

  return (
    <HireSignalFilterProvider
      setFilters={hiring.setFilters}
      draftRef={companyCohortDraftRef}
    >
      <HiringSignalsPageBody
        hiring={hiring}
        signalTimePreset={signalTimePreset}
        setSignalTimePreset={setSignalTimePreset}
      />
    </HireSignalFilterProvider>
  );
}

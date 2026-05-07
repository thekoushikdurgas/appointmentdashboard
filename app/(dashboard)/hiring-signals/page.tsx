"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { History, RefreshCw, Play, Zap, Download } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { Pagination } from "@/components/patterns/Pagination";
import { DataToolbar } from "@/components/patterns/DataToolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  effectivePostedAfter,
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
import { HiringSignalsDataTable } from "@/components/feature/hiring-signals/HiringSignalsDataTable";
import {
  HiringSignalsExportModal,
  type HiringSignalsExportIntent,
} from "@/components/feature/hiring-signals/HiringSignalsExportModal";
import { JobDescriptionModal } from "@/components/feature/hiring-signals/JobDescriptionModal";
import { CompanyContactsModal } from "@/components/feature/hiring-signals/CompanyContactsModal";
import { JobConnectraModal } from "@/components/feature/hiring-signals/JobConnectraModal";
import { CompanyDrawerPanel } from "@/components/feature/hiring-signals/CompanyDrawerPanel";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/common/useBreakpoint";
import { isSuccessfulTerminalJobStatus } from "@/lib/jobs/jobsUtils";
import { parseOperationError } from "@/lib/errorParser";
import {
  exportSelectedHireSignalJobs,
  fetchHireSignalExportStatus,
  fetchLinkedinJobIdsAllMatching,
  fetchLinkedinJobIdsFirstN,
} from "@/services/graphql/hiringSignalService";
import { Alert } from "@/components/ui/Alert";
import { toast } from "sonner";
import { useJobsDrawer } from "@/context/JobsDrawerContext";
import { useRole } from "@/context/RoleContext";
import { SavedSearchesMenu } from "@/components/feature/saved-searches/SavedSearchesMenu";
import {
  HIRE_SIGNAL_SAVED_SEARCH_VERSION,
  type HireSignalSavedSearchPayload,
} from "@/lib/savedSearchPayload";

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
    refetch,
    currentPage,
  } = hiring;

  const { activeDraftCount } = useHireSignalFilter();
  const isDesktop = useIsDesktop();
  const { isAdmin, isSuperAdmin } = useRole();
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
  const [mainTab, setMainTab] = useState<"signals" | "runs">("signals");
  const [runsReloadTick, setRunsReloadTick] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [tableDensity, setTableDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );
  const [exportBusy, setExportBusy] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportBanner, setExportBanner] = useState<{
    jobId: string;
    status: string;
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
      setFilters({ ...p.listFilters, offset: 0 });
    },
    [setFilters, setSignalTimePreset],
  );

  const hireSignalSavedSearchesMenu = useMemo(
    () => (
      <SavedSearchesMenu
        entity="hire_signal"
        getHireSignalPayload={getHireSignalSavedPayload}
        onApplyHireSignal={handleApplyHireSignalSaved}
      />
    ),
    [getHireSignalSavedPayload, handleApplyHireSignalSaved],
  );

  const effectiveJobListFilters = useMemo(
    () => ({
      ...filters,
      postedAfter: effectivePostedAfter(signalTimePreset, filters.postedAfter),
    }),
    [filters, signalTimePreset],
  );

  const queueHireSignalXlsxExport = useCallback(
    async (linkedinJobIds: string[]) => {
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
    },
    [openJobsDrawer],
  );

  const handleExportIntent = useCallback(
    async (intent: HiringSignalsExportIntent) => {
      setExportBusy(true);
      try {
        let linkedinJobIds: string[] = [];
        if (intent.scope === "selected") {
          linkedinJobIds = intent.linkedinJobIds;
        } else if (intent.scope === "first_n") {
          linkedinJobIds = await fetchLinkedinJobIdsFirstN(
            effectiveJobListFilters,
            intent.n,
          );
        } else {
          const r = await fetchLinkedinJobIdsAllMatching(
            effectiveJobListFilters,
          );
          linkedinJobIds = r.ids;
          if (r.truncated) {
            toast.message("Large export", {
              description: `Including ${linkedinJobIds.length.toLocaleString()} of ${r.totalMatching.toLocaleString()} matching rows (server limit). Narrow filters if you need a smaller file.`,
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
    [effectiveJobListFilters, queueHireSignalXlsxExport],
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

  useEffect(() => {
    if (!showRunsTab && mainTab === "runs") setMainTab("signals");
  }, [showRunsTab, mainTab]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "runs" && showRunsTab) setMainTab("runs");
  }, [searchParams, showRunsTab]);

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
      filterConfig={{
        activeCount: activeDraftCount,
        onOpen: () => setMobileFiltersOpen(true),
        show: !isDesktop,
      }}
      actions={[
        {
          label: "Export XLSX",
          onClick: () => setExportModalOpen(true),
          icon: Download,
          variant: "secondary",
          disabled: loading || total === 0,
        },
        {
          label: "Refresh",
          onClick: () => void refetch(),
          icon: RefreshCw,
          variant: "secondary",
          disabled: loading,
        },
        ...(isSuperAdmin
          ? [
              {
                label: "Run scrape",
                onClick: () => setScrapeModalOpen(true),
                icon: Play,
                variant: "primary" as const,
              },
            ]
          : []),
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
        value={showTabList ? mainTab : "signals"}
        onValueChange={
          showTabList ? (v) => setMainTab(v as "signals" | "runs") : undefined
        }
        variant={showTabList ? "floating" : "dashboard"}
        className={cn(
          "c360-tabs--hiring-signals",
          showTabList && "c360-tabs--floating-bottom",
          "c360-mb-4",
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
          <TabsContent value="runs">
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
            mobileFiltersOpen={mobileFiltersOpen}
            onMobileFiltersClose={() => setMobileFiltersOpen(false)}
            filtersAriaLabel="Hiring signal filters"
            filterDrawerTitleId="c360-hs-filter-drawer-title"
            filtersPeekRail
            filtersPeekScope="hiring-signals"
            filtersPinExtra={hireSignalSavedSearchesMenu}
            toolbar={signalsToolbar}
            filters={
              <>
                {!isDesktop ? (
                  <div className="c360-data-layout__filters-mobile-saved">
                    {hireSignalSavedSearchesMenu}
                  </div>
                ) : null}
                <HiringSignalsFilterSidebar
                  drawerTitleId="c360-hs-filter-drawer-title"
                  appliedListFilters={filters}
                  signalTimePreset={signalTimePreset}
                  appliedRunId={filters.runId}
                  onClearRunId={clearRunFilter}
                  tableDensity={tableDensity}
                  onTableDensityChange={setTableDensity}
                />
              </>
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
              onOpenDescription={setJd}
              onOpenCompany={setCompanyRow}
              onOpenConnectra={setConnectraRow}
              onOpenCompanyDrawer={(row) => setDrawerRow(row)}
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
              density={tableDensity}
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

      <HiringSignalsExportModal
        isOpen={exportModalOpen}
        onClose={() => !exportBusy && setExportModalOpen(false)}
        jobs={jobs}
        totalMatching={total}
        selectedKeys={selectedKeys}
        defaultFirstN={filters.limit}
        busy={exportBusy}
        onConfirm={(intent) => void handleExportIntent(intent)}
      />

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

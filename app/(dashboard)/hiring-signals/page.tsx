"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History, RefreshCw, Play } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/patterns/Pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  useHiringSignals,
  type LinkedInJobRow,
} from "@/hooks/useHiringSignals";
import {
  asRecord,
  fetchHireSignalRuns,
  fetchListScrapeJobs,
  fetchScrapeJobJobs,
  refreshHireSignalRun,
} from "@/services/graphql/hiringSignalService";
import { RunScrapeModal } from "@/components/feature/hiring-signals/RunScrapeModal";
import {
  downloadTextFile,
  linkedinJobsPayloadToCsv,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { HiringSignalStatsBar } from "@/components/feature/hiring-signals/HiringSignalStatsBar";
import {
  HiringSignalsFilterSidebar,
  EMPTY_HIRING_SIGNAL_DRAFT,
  type HiringSignalFilterDraft,
  type HiringSignalDraftField,
} from "@/components/feature/hiring-signals/HiringSignalsFilterSidebar";
import { HiringSignalsDataTable } from "@/components/feature/hiring-signals/HiringSignalsDataTable";
import { JobDescriptionModal } from "@/components/feature/hiring-signals/JobDescriptionModal";
import { CompanyContactsModal } from "@/components/feature/hiring-signals/CompanyContactsModal";
import { JobConnectraModal } from "@/components/feature/hiring-signals/JobConnectraModal";
import { HiringSignalsDashboard } from "@/components/feature/hiring-signals/HiringSignalsDashboard";
import { CompanyDrawerPanel } from "@/components/feature/hiring-signals/CompanyDrawerPanel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LayoutDashboard, Zap } from "lucide-react";

export default function HiringSignalsPage() {
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
  } = useHiringSignals();

  const [draft, setDraft] = useState<HiringSignalFilterDraft>(
    EMPTY_HIRING_SIGNAL_DRAFT,
  );
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
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsPayload, setRunsPayload] = useState<unknown>(null);
  const [scrapeJobsPayload, setScrapeJobsPayload] = useState<unknown>(null);
  const [runActionId, setRunActionId] = useState<string | null>(null);
  const [scrapeDownloadId, setScrapeDownloadId] = useState<string | null>(null);

  const previewJobsForDrawer = useMemo(() => {
    if (!drawerRow?.companyUuid) return [];
    const u = drawerRow.companyUuid;
    return jobs.filter((j) => j.companyUuid === u);
  }, [drawerRow, jobs]);

  const applyFilters = useCallback(() => {
    setFilters((f) => ({
      ...f,
      title: draft.title.trim() || undefined,
      company: draft.company.trim() || undefined,
      location: draft.location.trim() || undefined,
      employmentType: draft.employmentType.trim() || undefined,
      seniority:
        draft.seniorityCustom.trim() ||
        draft.seniorityPreset.trim() ||
        undefined,
      functionCategory:
        draft.functionCustom.trim() || draft.functionPreset.trim() || undefined,
      postedAfter: draft.postedAfter.trim() || undefined,
      postedBefore: draft.postedBefore.trim() || undefined,
      offset: 0,
    }));
    setMobileFiltersOpen(false);
  }, [draft, setFilters]);

  const resetFilters = useCallback(() => {
    setDraft(EMPTY_HIRING_SIGNAL_DRAFT);
    setFilters((f) => ({
      ...f,
      title: undefined,
      company: undefined,
      location: undefined,
      employmentType: undefined,
      seniority: undefined,
      functionCategory: undefined,
      postedAfter: undefined,
      postedBefore: undefined,
      offset: 0,
    }));
  }, [setFilters]);

  const onDraftField = useCallback(
    (field: HiringSignalDraftField, value: string) => {
      setDraft((d) => ({ ...d, [field]: value }));
    },
    [],
  );

  const loadRunsTab = useCallback(async () => {
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
    if (mainTab === "runs") void loadRunsTab();
  }, [mainTab, loadRunsTab]);

  const onRefreshSatelliteRun = useCallback(
    async (runId: string) => {
      const rid = runId.trim();
      if (!rid) return;
      setRunActionId(rid);
      try {
        await refreshHireSignalRun(rid);
        toast.success("Run status refreshed from Apify");
        void loadRunsTab();
      } catch (e) {
        const m = e instanceof Error ? e.message : "Refresh failed";
        toast.error("Refresh run", { description: m });
      } finally {
        setRunActionId(null);
      }
    },
    [loadRunsTab],
  );

  const onDownloadScrapeCsv = useCallback(
    async (scrapeJobId: string) => {
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
    },
    [],
  );

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

  return (
    <DashboardPageLayout>
      <div className="c360-mb-4 c360-flex c360-flex-col c360-gap-3 c360-hs-page-head">
        <div>
          <h1 className="c360-page-header__title">Hiring signals</h1>
          <p className="c360-page-header__subtitle">
            LinkedIn roles ingested on job.server (Apify) and linked to
            companies for Connectra. Use{" "}
            <span className="c360-font-medium c360-text-ink">Hire signal</span>{" "}
            in GraphQL (gateway) or the actions below.
          </p>
        </div>
        <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="c360-gap-2"
            onClick={() => void refetch()}
            disabled={loading}
            leftIcon={
              <RefreshCw size={15} className={cn(loading && "c360-spin")} />
            }
          >
            Refresh
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="c360-gap-2"
            onClick={() => setScrapeModalOpen(true)}
            leftIcon={<Play size={15} />}
          >
            Run scrape
          </Button>
        </div>
      </div>

      {error ? (
        <p className="c360-mb-4 c360-text-sm c360-text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <Tabs
        value={mainTab}
        onValueChange={(v) =>
          setMainTab(v as "overview" | "signals" | "runs")
        }
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
          />
        </TabsContent>
        <TabsContent value="runs">
          <div className="c360-flex c360-flex-col c360-gap-6">
            <div className="c360-flex c360-flex-wrap c360-items-center c360-justify-between c360-gap-2">
              <h2 className="c360-m-0 c360-text-sm c360-font-semibold c360-text-ink">
                Job.server runs &amp; your scrape history
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="c360-gap-2"
                onClick={() => void loadRunsTab()}
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
              {runsLoading && satelliteRunsRows.length === 0 ? (
                <p className="c360-text-sm c360-text-muted">Loading…</p>
              ) : satelliteRunsRows.length === 0 ? (
                <p className="c360-text-sm c360-text-muted">No runs yet.</p>
              ) : (
                <div className="c360-overflow-x-auto c360-rounded c360-border c360-border-ink-8">
                  <table className="c360-w-full c360-text-left c360-text-2xs">
                    <thead className="c360-border-b c360-border-ink-8 c360-bg-ink-1/40">
                      <tr>
                        <th className="c360-p-2">Run ID</th>
                        <th className="c360-p-2">Status</th>
                        <th className="c360-p-2">Items</th>
                        <th className="c360-p-2">Started</th>
                        <th className="c360-p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {satelliteRunsRows.map((row) => {
                        const rid = String(
                          row.runId ?? row.run_id ?? row.id ?? "",
                        );
                        return (
                          <tr
                            key={rid || JSON.stringify(row).slice(0, 40)}
                            className="c360-border-b c360-border-ink-8/80"
                          >
                            <td className="c360-max-w-[200px] c360-p-2 c360-font-mono c360-break-all">
                              {rid || "—"}
                            </td>
                            <td className="c360-p-2">
                              {String(row.status ?? "—")}
                            </td>
                            <td className="c360-p-2">
                              {String(row.itemCount ?? row.item_count ?? "—")}
                            </td>
                            <td className="c360-p-2 c360-text-muted">
                              {String(row.startedAt ?? row.started_at ?? "—")}
                            </td>
                            <td className="c360-p-2">
                              {rid ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={runActionId === rid}
                                  onClick={() => void onRefreshSatelliteRun(rid)}
                                >
                                  {runActionId === rid
                                    ? "Refreshing…"
                                    : "Refresh"}
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h3 className="c360-mb-2 c360-text-2xs c360-font-semibold c360-uppercase c360-tracking-wide c360-text-muted">
                Your tracked scrapes (gateway)
              </h3>
              {runsLoading && trackedScrapeRows.length === 0 ? (
                <p className="c360-text-sm c360-text-muted">Loading…</p>
              ) : trackedScrapeRows.length === 0 ? (
                <p className="c360-text-sm c360-text-muted">
                  No tracked scrapes yet. Use <strong>Run scrape</strong> to
                  queue one.
                </p>
              ) : (
                <div className="c360-overflow-x-auto c360-rounded c360-border c360-border-ink-8">
                  <table className="c360-w-full c360-text-left c360-text-2xs">
                    <thead className="c360-border-b c360-border-ink-8 c360-bg-ink-1/40">
                      <tr>
                        <th className="c360-p-2">Scrape job</th>
                        <th className="c360-p-2">Status</th>
                        <th className="c360-p-2">Apify run</th>
                        <th className="c360-p-2">Created</th>
                        <th className="c360-p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {trackedScrapeRows.map((row) => {
                        const sid = String(row.id ?? "");
                        const apify = String(row.apifyRunId ?? "");
                        return (
                          <tr
                            key={sid}
                            className="c360-border-b c360-border-ink-8/80"
                          >
                            <td className="c360-max-w-[180px] c360-p-2 c360-font-mono c360-break-all">
                              {sid || "—"}
                            </td>
                            <td className="c360-p-2">
                              {String(row.status ?? "—")}
                            </td>
                            <td className="c360-max-w-[160px] c360-p-2 c360-font-mono c360-break-all">
                              {apify || "—"}
                            </td>
                            <td className="c360-p-2 c360-text-muted">
                              {String(row.createdAt ?? "—")}
                            </td>
                            <td className="c360-p-2">
                              {sid ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={
                                    scrapeDownloadId === sid || !apify
                                  }
                                  onClick={() => void onDownloadScrapeCsv(sid)}
                                >
                                  {scrapeDownloadId === sid
                                    ? "Exporting…"
                                    : "CSV"}
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </TabsContent>
        <TabsContent value="signals">
          {renderStatsBar()}
          <DataPageLayout
            showFilters
            mobileFiltersOpen={mobileFiltersOpen}
            onMobileFiltersClose={() => setMobileFiltersOpen(false)}
            toolbar={
              <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="c360-hs-filters-mobile-toggle"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  Filters
                </Button>
              </div>
            }
            filters={
              <HiringSignalsFilterSidebar
                values={draft}
                onChange={onDraftField}
                onApply={applyFilters}
                onReset={resetFilters}
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
          void loadRunsTab();
        }}
      />
    </DashboardPageLayout>
  );
}

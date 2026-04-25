"use client";

import { useCallback, useMemo, useState } from "react";
import { RefreshCw, Play } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/patterns/Pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  useHiringSignals,
  type LinkedInJobRow,
} from "@/hooks/useHiringSignals";
import { triggerHireSignalScrape } from "@/services/graphql/hiringSignalService";
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
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [jd, setJd] = useState<LinkedInJobRow | null>(null);
  const [companyRow, setCompanyRow] = useState<LinkedInJobRow | null>(null);
  const [connectraRow, setConnectraRow] = useState<LinkedInJobRow | null>(null);
  const [drawerRow, setDrawerRow] = useState<LinkedInJobRow | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [mainTab, setMainTab] = useState<"overview" | "signals">("signals");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  const runScrape = useCallback(async () => {
    setScrapeLoading(true);
    try {
      const res = await triggerHireSignalScrape();
      const raw = res.hireSignal?.triggerScrape;
      const ok =
        raw &&
        typeof raw === "object" &&
        (raw as { success?: boolean }).success;
      if (ok) {
        toast.success("Scrape queued", {
          description: "Poll job.server or refresh this list shortly.",
        });
        void refetch();
      } else {
        const msg = JSON.stringify(raw);
        toast.message("Scrape response", { description: msg });
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : "Request failed";
      toast.error("Scrape", { description: m });
    } finally {
      setScrapeLoading(false);
    }
  }, [refetch]);

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
            onClick={() => void runScrape()}
            disabled={scrapeLoading}
            leftIcon={
              <Play
                size={15}
                className={cn(scrapeLoading && "c360-opacity-60")}
              />
            }
          >
            {scrapeLoading ? "Queuing…" : "Run scrape"}
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
        onValueChange={(v) => setMainTab(v as "overview" | "signals")}
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
        </TabsList>
        <TabsContent value="overview">
          <HiringSignalsDashboard
            jobs={jobs}
            loading={loading}
            statsBar={renderStatsBar()}
            onOpenCompanyDrawer={(row) => setDrawerRow(row)}
          />
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
    </DashboardPageLayout>
  );
}

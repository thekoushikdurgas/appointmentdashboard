"use client";

import { useCallback, useState } from "react";
import { RefreshCw, Play } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/patterns/Pagination";
import {
  useHiringSignals,
  type LinkedInJobRow,
} from "@/hooks/useHiringSignals";
import { triggerHireSignalScrape } from "@/services/graphql/hiringSignalService";
import { HiringSignalStatsBar } from "@/components/feature/hiring-signals/HiringSignalStatsBar";
import { HiringSignalsFilterSidebar } from "@/components/feature/hiring-signals/HiringSignalsFilterSidebar";
import { HiringSignalsDataTable } from "@/components/feature/hiring-signals/HiringSignalsDataTable";
import { JobDescriptionModal } from "@/components/feature/hiring-signals/JobDescriptionModal";
import { CompanyContactsModal } from "@/components/feature/hiring-signals/CompanyContactsModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Draft = {
  title: string;
  company: string;
  location: string;
  employmentType: string;
};

const EMPTY_DRAFT: Draft = {
  title: "",
  company: "",
  location: "",
  employmentType: "",
};

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

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [jd, setJd] = useState<LinkedInJobRow | null>(null);
  const [companyRow, setCompanyRow] = useState<LinkedInJobRow | null>(null);

  const applyFilters = useCallback(() => {
    setFilters((f) => ({
      ...f,
      title: draft.title.trim() || undefined,
      company: draft.company.trim() || undefined,
      location: draft.location.trim() || undefined,
      employmentType: draft.employmentType.trim() || undefined,
      offset: 0,
    }));
  }, [draft, setFilters]);

  const resetFilters = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setFilters((f) => ({
      ...f,
      title: undefined,
      company: undefined,
      location: undefined,
      employmentType: undefined,
      offset: 0,
    }));
  }, [setFilters]);

  const onDraftField = useCallback(
    (
      field: keyof import("@/services/graphql/hiringSignalService").JobListFilters,
      value: string,
    ) => {
      if (
        field === "title" ||
        field === "company" ||
        field === "location" ||
        field === "employmentType"
      ) {
        setDraft((d) => ({ ...d, [field]: value }));
      }
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

  return (
    <DashboardPageLayout>
      <div className="c360-mb-4 c360-flex c360-flex-col c360-gap-3 c360-sm:flex-row c360-sm:items-end c360-sm:justify-between">
        <div>
          <h1 className="c360-page-header__title">Hiring signals</h1>
          <p className="c360-page-header__subtitle">
            LinkedIn roles ingested on job.server (Apify) and linked to
            companies for Connectra. Use &nbsp;
            <span className="c360-font-medium c360-text-ink">
              Hiring signal
            </span>
            &nbsp;in GraphQL (gateway) or the actions below.
          </p>
        </div>
        <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="c360-gap-1.5"
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
            className="c360-gap-1.5"
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

      <HiringSignalStatsBar
        totalJobs={stats.totalJobs}
        jobsWithCompany={stats.jobsWithCompany}
        loading={statsLoading}
        className="c360-mb-4"
      />

      <DataPageLayout
        showFilters
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
            Server-paginated list; set filters in the left column, then Apply.
          </p>
        </div>
        <HiringSignalsDataTable
          rows={jobs}
          loading={loading}
          pageSize={filters.limit}
          onPageSizeChange={setPageSize}
          onOpenDescription={setJd}
          onOpenCompany={setCompanyRow}
        />
      </DataPageLayout>

      <JobDescriptionModal job={jd} isOpen={!!jd} onClose={() => setJd(null)} />
      {companyRow?.companyUuid ? (
        <CompanyContactsModal
          companyUuid={companyRow.companyUuid}
          companyName={companyRow.companyName || "Company"}
          isOpen={!!companyRow}
          onClose={() => setCompanyRow(null)}
        />
      ) : null}
    </DashboardPageLayout>
  );
}

"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { RefreshCw } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { STORAGE_KEYS } from "@/lib/constants";
import { DataToolbar } from "@/components/patterns/DataToolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import type {
  HiringSignalIndexStats,
  LinkedInJobRow,
} from "@/hooks/useHiringSignals";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";
import { HiringSignalsFilterSidebar } from "@/components/feature/hiring-signals/HiringSignalsFilterSidebar";
import { CompanyDrawerPanel } from "@/components/feature/hiring-signals/CompanyDrawerPanel";
import { companyDrawerAnchorFromJob } from "@/lib/companyDrawerAnchor";
import { HiringSignalEmploymentTypeCard } from "@/components/feature/hiring-signals/HiringSignalCharts";
import { HiringSignalTopCompaniesCard } from "@/components/feature/hiring-signals/HiringSignalTopCompaniesCard";
import { OverviewTab } from "@/components/feature/market-insights/OverviewTab";
import { SourcesTab } from "@/components/feature/market-insights/SourcesTab";
import { LocationsTab } from "@/components/feature/market-insights/LocationsTab";
import { TitlesTab } from "@/components/feature/market-insights/TitlesTab";
import { SkillsTab } from "@/components/feature/market-insights/SkillsTab";
import { SalaryTab } from "@/components/feature/market-insights/SalaryTab";

const HiringSignalJobsGlobe = dynamic(
  () =>
    import("@/components/feature/hiring-signals/HiringSignalJobsGlobe").then(
      (m) => m.HiringSignalJobsGlobe,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="c360-flex c360-min-h-[200px] c360-items-center c360-justify-center">
        <span className="c360-spinner" aria-label="Loading globe…" />
      </div>
    ),
  },
);

export interface MarketInsightsPageProps {
  hiring: {
    jobs: LinkedInJobRow[];
    loading: boolean;
    error: string | null;
    filters: JobListFilters;
    refetch: () => Promise<void>;
    total?: number;
    stats: HiringSignalIndexStats;
    statsLoading: boolean;
    analyticsMatchCappedAt: number | null;
  };
  signalTimePreset: "all" | "new_7d";
}

export function MarketInsightsPage({
  hiring,
  signalTimePreset,
}: MarketInsightsPageProps) {
  const {
    jobs,
    loading,
    error,
    filters,
    refetch,
    total,
    stats,
    statsLoading,
    analyticsMatchCappedAt,
  } = hiring;

  const toolbarMatchTotal =
    typeof total === "number" && total > 0 ? total : jobs.length;
  const [tab, setTab] = useState("overview");
  const [drawerRow, setDrawerRow] = useState<LinkedInJobRow | null>(null);

  const previewJobsForDrawer = useMemo(() => {
    if (!drawerRow?.companyUuid) return [];
    const u = drawerRow.companyUuid;
    return jobs.filter((j) => j.companyUuid === u);
  }, [drawerRow, jobs]);

  const toolbar = useMemo(
    () => (
      <DataToolbar
        cssPrefix="c360-toolbar"
        tabs={[
          {
            value: "overview",
            label: "Market",
            count: toolbarMatchTotal,
            showCountOnlyWhenActive: false,
          },
        ]}
        activeTab="overview"
        onTabChange={() => {}}
        totalCount={toolbarMatchTotal}
        actions={[
          {
            label: "Refresh",
            onClick: () => void refetch(),
            icon: RefreshCw,
            variant: "secondary",
            disabled: loading,
          },
        ]}
      />
    ),
    [toolbarMatchTotal, loading, refetch],
  );

  return (
    <DashboardPageLayout>
      {error ? (
        <p className="c360-mb-4 c360-text-sm c360-text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <DataPageLayout
        className="c360-market-insights-page"
        showFilters
        filtersPanelStorageKey={
          STORAGE_KEYS.DATA_FILTERS_PEEK_PINNED_MARKET_INSIGHTS
        }
        filtersAriaLabel="Hiring signal filters"
        toolbar={toolbar}
        filters={
          <HiringSignalsFilterSidebar
            appliedListFilters={filters}
            signalTimePreset={signalTimePreset}
            appliedRunId={filters.runId}
            runScopedJobTotal={
              filters.runId?.trim() && typeof total === "number"
                ? total
                : undefined
            }
          />
        }
      >
        <div className="c360-flex c360-flex-col c360-gap-6 c360-mb-4">
          <HiringSignalJobsGlobe
            jobs={jobs}
            loading={loading}
            fetchCappedAt={analyticsMatchCappedAt}
          />
          <div className="c360-2col-grid c360-hs-dashboard-2col">
            <HiringSignalEmploymentTypeCard jobs={jobs} />
            <HiringSignalTopCompaniesCard
              jobs={jobs}
              onOpenCompanyDrawer={(row) => setDrawerRow(row)}
            />
          </div>
        </div>
        <Tabs value={tab} onValueChange={setTab} variant="floating">
          <TabsList className="c360-mb-4 c360-flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sources">Sources &amp; Employers</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="titles">Titles</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="salary">Salary &amp; Experience</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <OverviewTab
              jobs={jobs}
              total={total}
              stats={stats}
              statsLoading={statsLoading}
              analyticsMatchCappedAt={analyticsMatchCappedAt}
              jobsLoading={loading}
            />
          </TabsContent>
          <TabsContent value="sources">
            <SourcesTab jobs={jobs} />
          </TabsContent>
          <TabsContent value="locations">
            <LocationsTab jobs={jobs} />
          </TabsContent>
          <TabsContent value="titles">
            <TitlesTab jobs={jobs} />
          </TabsContent>
          <TabsContent value="skills">
            <SkillsTab jobs={jobs} />
          </TabsContent>
          <TabsContent value="salary">
            <SalaryTab jobs={jobs} />
          </TabsContent>
        </Tabs>
      </DataPageLayout>
      <CompanyDrawerPanel
        anchor={drawerRow ? companyDrawerAnchorFromJob(drawerRow) : null}
        previewJobs={previewJobsForDrawer}
        isOpen={!!drawerRow}
        onClose={() => setDrawerRow(null)}
      />
    </DashboardPageLayout>
  );
}

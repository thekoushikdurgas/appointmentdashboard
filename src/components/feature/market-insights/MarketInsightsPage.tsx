"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { DataToolbar } from "@/components/patterns/DataToolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import { useIsDesktop } from "@/hooks/common/useBreakpoint";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";
import { HiringSignalsFilterSidebar } from "@/components/feature/hiring-signals/HiringSignalsFilterSidebar";
import { OverviewTab } from "@/components/feature/market-insights/OverviewTab";
import { SourcesTab } from "@/components/feature/market-insights/SourcesTab";
import { LocationsTab } from "@/components/feature/market-insights/LocationsTab";
import { TitlesTab } from "@/components/feature/market-insights/TitlesTab";
import { SkillsTab } from "@/components/feature/market-insights/SkillsTab";
import { SalaryTab } from "@/components/feature/market-insights/SalaryTab";

export interface MarketInsightsPageProps {
  hiring: {
    jobs: LinkedInJobRow[];
    loading: boolean;
    error: string | null;
    filters: JobListFilters;
    refetch: () => Promise<void>;
  };
  signalTimePreset: "all" | "new_7d";
}

export function MarketInsightsPage({
  hiring,
  signalTimePreset,
}: MarketInsightsPageProps) {
  const { jobs, loading, error, filters, refetch } = hiring;
  const { activeDraftCount } = useHireSignalFilter();
  const isDesktop = useIsDesktop();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [tab, setTab] = useState("overview");

  const toolbar = useMemo(
    () => (
      <DataToolbar
        cssPrefix="c360-toolbar"
        tabs={[
          {
            value: "overview",
            label: "Market",
            count: jobs.length,
            showCountOnlyWhenActive: false,
          },
        ]}
        activeTab="overview"
        onTabChange={() => {}}
        totalCount={jobs.length}
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
        ]}
      />
    ),
    [activeDraftCount, isDesktop, jobs.length, loading, refetch],
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
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersClose={() => setMobileFiltersOpen(false)}
        filtersAriaLabel="Hiring signal filters"
        filterDrawerTitleId="c360-market-filter-drawer-title"
        filtersPeekRail
        filtersPeekScope="hiring-signals"
        toolbar={toolbar}
        filters={
          <HiringSignalsFilterSidebar
            drawerTitleId="c360-market-filter-drawer-title"
            appliedListFilters={filters}
            signalTimePreset={signalTimePreset}
            appliedRunId={filters.runId}
          />
        }
      >
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
            <OverviewTab jobs={jobs} />
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
    </DashboardPageLayout>
  );
}

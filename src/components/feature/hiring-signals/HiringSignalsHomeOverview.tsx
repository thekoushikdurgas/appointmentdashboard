"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HiringSignalsDashboard } from "@/components/feature/hiring-signals/HiringSignalsDashboard";
import { HiringSignalJobsGlobe } from "@/components/feature/hiring-signals/HiringSignalJobsGlobe";
import { HiringSignalStatsBar } from "@/components/feature/hiring-signals/HiringSignalStatsBar";
import { CompanyDrawerPanel } from "@/components/feature/hiring-signals/CompanyDrawerPanel";
import { useHiringSignals } from "@/hooks/useHiringSignals";
import { useHireSignalRuns } from "@/hooks/useHireSignalRuns";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";

const RUNS_TAB_PAGE_SIZE = 10;

/**
 * Hiring signals charts + latest-run card for the main dashboard (same content as the former
 * Hiring signals → Overview tab).
 */
export function HiringSignalsHomeOverview() {
  const router = useRouter();
  const { jobs, total, stats, loading, statsLoading } = useHiringSignals(
    {},
    { signalTimePreset: "all" },
  );

  const { satelliteRunsRows, runsLoading } = useHireSignalRuns("overview", {
    satellitePage: 1,
    runsPageSize: RUNS_TAB_PAGE_SIZE,
  });

  const latestSatelliteRun = satelliteRunsRows[0];
  const [drawerRow, setDrawerRow] = useState<LinkedInJobRow | null>(null);

  const previewJobsForDrawer = useMemo(() => {
    if (!drawerRow?.companyUuid) return [];
    const u = drawerRow.companyUuid;
    return jobs.filter((j) => j.companyUuid === u);
  }, [drawerRow, jobs]);

  const statsBar = (
    <HiringSignalStatsBar
      totalJobs={stats.totalJobs}
      jobsWithCompany={stats.jobsWithCompany}
      filterMatchTotal={total}
      pageRowCount={jobs.length}
      loading={statsLoading}
    />
  );

  return (
    <>
      <HiringSignalsDashboard
        jobs={jobs}
        loading={loading}
        statsBar={statsBar}
        belowStatsSlot={<HiringSignalJobsGlobe jobs={jobs} loading={loading} />}
        onOpenCompanyDrawer={(row) => setDrawerRow(row)}
        latestRun={latestSatelliteRun}
        runsLoading={runsLoading}
        onGoToRuns={() => router.push("/hiring-signals?tab=runs")}
      />
      <CompanyDrawerPanel
        anchor={drawerRow}
        previewJobs={previewJobsForDrawer}
        isOpen={!!drawerRow}
        onClose={() => setDrawerRow(null)}
      />
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { HiringSignalsDashboard } from "@/components/feature/hiring-signals/HiringSignalsDashboard";
import { HiringSignalStatsBar } from "@/components/feature/hiring-signals/HiringSignalStatsBar";
import { CompanyDrawerPanel } from "@/components/feature/hiring-signals/CompanyDrawerPanel";
import { companyDrawerAnchorFromJob } from "@/lib/companyDrawerAnchor";
import { useHireSignalRuns } from "@/hooks/useHireSignalRuns";
import type {
  LinkedInJobRow,
  UseHiringSignalsResult,
} from "@/hooks/useHiringSignals";

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

const RUNS_TAB_PAGE_SIZE = 10;

/**
 * Hiring signals charts + latest-run card for the main dashboard (same content as the former
 * Hiring signals → Overview tab). Receives `hiring` from the parent so the dashboard can share
 * one `useHiringSignals` instance with the Job activity chart.
 */
export function HiringSignalsHomeOverview({
  hiring,
}: {
  hiring: UseHiringSignalsResult;
}) {
  const router = useRouter();
  const { jobs, total, stats, loading, statsLoading, analyticsMatchCappedAt } =
    hiring;

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
        belowStatsSlot={
          <HiringSignalJobsGlobe
            jobs={jobs}
            loading={loading}
            fetchCappedAt={analyticsMatchCappedAt}
          />
        }
        onOpenCompanyDrawer={(row) => setDrawerRow(row)}
        latestRun={latestSatelliteRun}
        runsLoading={runsLoading}
        onGoToRuns={() => router.push("/hiring-signals?tab=runs")}
      />
      <CompanyDrawerPanel
        anchor={drawerRow ? companyDrawerAnchorFromJob(drawerRow) : null}
        previewJobs={previewJobsForDrawer}
        isOpen={!!drawerRow}
        onClose={() => setDrawerRow(null)}
      />
    </>
  );
}

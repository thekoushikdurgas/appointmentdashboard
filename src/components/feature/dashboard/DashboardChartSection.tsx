"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { DashboardJobActivityChart } from "@/components/feature/dashboard/DashboardJobActivityChart";
import {
  buildJobActivityFallbackSeries,
  buildJobActivitySeriesFromJobs,
} from "@/lib/dashboardJobActivitySeries";
import {
  DashboardActivityFeed,
  type ActivityItem,
} from "./DashboardActivityFeed";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";

interface DashboardChartSectionProps {
  /** When set (Pro/Admin dashboard), chart is built from loaded hiring-signal jobs. */
  jobs?: LinkedInJobRow[];
  jobsLoading?: boolean;
  activity: ActivityItem[];
}

export function DashboardChartSection({
  jobs,
  jobsLoading = false,
  activity,
}: DashboardChartSectionProps) {
  const jobChartData = useMemo(() => {
    if (jobs == null) return buildJobActivityFallbackSeries();
    return buildJobActivitySeriesFromJobs(jobs, 30);
  }, [jobs]);

  const jobCardSubtitle =
    jobs != null
      ? "Daily counts from hiring-signal job rows (last 30 days by posted date)."
      : "Sample preview — upgrade to Pro to chart live hiring-signal job volume.";

  const showJobLoading = jobs != null && jobsLoading && jobs.length === 0;

  return (
    <div className="c360-dashboard-layout__charts">
      <Card
        title="Job activity"
        subtitle={jobCardSubtitle}
        className="c360-dashboard-job-activity-card"
      >
        {showJobLoading ? (
          <p className="c360-text-sm c360-text-muted c360-m-0">
            Loading job activity…
          </p>
        ) : (
          <DashboardJobActivityChart data={jobChartData} />
        )}
      </Card>

      <Card
        title="Recent Activity"
        subtitle="Latest events"
        className="c360-dashboard-recent-activity-card"
      >
        <DashboardActivityFeed items={activity} />
      </Card>
    </div>
  );
}

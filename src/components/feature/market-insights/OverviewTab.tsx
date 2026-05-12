"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import type {
  HiringSignalIndexStats,
  LinkedInJobRow,
} from "@/hooks/useHiringSignals";
import {
  buildMedianSalary,
  buildMonthlyPostingsSeries,
  buildMonthlySalaryRange,
  buildRemoteCount,
  distinctCompanies,
  distinctCountries,
} from "@/lib/hiringAnalytics";
import { HiringKpiStrip } from "@/components/feature/hiring-analytics/HiringKpiStrip";
import type { HiringDashboardKpis } from "@/components/feature/hiring-analytics/HiringKpiStrip";
import { CHART_COLORS, RECHARTS_DEFAULTS } from "@/lib/chartTheme";

export function OverviewTab({
  jobs,
  total,
  stats,
  statsLoading,
  analyticsMatchCappedAt,
  jobsLoading,
}: {
  jobs: LinkedInJobRow[];
  total?: number;
  stats: HiringSignalIndexStats;
  statsLoading: boolean;
  analyticsMatchCappedAt: number | null;
  jobsLoading: boolean;
}) {
  const kpi: HiringDashboardKpis | null = useMemo(() => {
    const med = buildMedianSalary(jobs);
    const listTotal = typeof total === "number" ? total : jobs.length;
    return {
      total_jobs: jobs.length,
      matching_postings_total: listTotal,
      loaded_rows: jobs.length,
      jobs_with_salary: med.n,
      median_salary_min_usd: med.median ?? undefined,
      remote_count: buildRemoteCount(jobs),
      distinct_countries: distinctCountries(jobs),
      distinct_companies: distinctCompanies(jobs),
      global_indexed_jobs: stats.totalJobs,
      global_jobs_with_company: stats.jobsWithCompany,
      global_median_salary_min_usd: stats.globalMedianSalaryMinUsd,
      analytics_match_capped_at: analyticsMatchCappedAt,
    };
  }, [jobs, total, stats, analyticsMatchCappedAt]);

  const monthly = useMemo(() => buildMonthlyPostingsSeries(jobs), [jobs]);
  const salary = useMemo(() => buildMonthlySalaryRange(jobs), [jobs]);

  return (
    <div className="c360-section-stack">
      <HiringKpiStrip data={kpi} loading={jobsLoading || statsLoading} />
      <div className="c360-2col-grid">
        <Card title="Posting trend" subtitle="Monthly count">
          <div className="c360-hs-chart c360-hs-chart--h280">
            {monthly.length === 0 ? (
              <p className="c360-text-sm c360-text-muted">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly} margin={RECHARTS_DEFAULTS.margin}>
                  <CartesianGrid {...RECHARTS_DEFAULTS.cartesianGridProps} />
                  <XAxis
                    dataKey="month"
                    {...RECHARTS_DEFAULTS.axisProps}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    {...RECHARTS_DEFAULTS.axisProps}
                  />
                  <Tooltip
                    contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card title="Salary range" subtitle="Median min / max USD by month">
          <div className="c360-hs-chart c360-hs-chart--h280">
            {salary.length === 0 ? (
              <p className="c360-text-sm c360-text-muted">No salary data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salary} margin={RECHARTS_DEFAULTS.margin}>
                  <CartesianGrid {...RECHARTS_DEFAULTS.cartesianGridProps} />
                  <XAxis
                    dataKey="month"
                    {...RECHARTS_DEFAULTS.axisProps}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis {...RECHARTS_DEFAULTS.axisProps} />
                  <Tooltip
                    contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle}
                  />
                  <Line
                    type="monotone"
                    dataKey="medianMin"
                    name="Median min"
                    stroke={CHART_COLORS.primary}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="medianMax"
                    name="Median max"
                    stroke={CHART_COLORS.accent}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
      <p className="c360-text-xs c360-text-muted">
        Based on LinkedIn-derived hiring signals in Contact360.
      </p>
    </div>
  );
}

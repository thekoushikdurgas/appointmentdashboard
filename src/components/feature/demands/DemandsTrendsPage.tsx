"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import DataPageLayout from "@/components/layouts/DataPageLayout";
import { DataToolbar } from "@/components/patterns/DataToolbar";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/shared/DonutChart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import { useIsDesktop } from "@/hooks/common/useBreakpoint";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import { CHART_COLORS, RECHARTS_DEFAULTS } from "@/lib/chartTheme";
import {
  buildCountryBreakdown,
  buildDailyPostingsSeries,
  buildEducationBreakdown,
  buildExperienceBucketBreakdown,
  buildLocationBreakdown,
  buildMedianSalary,
  buildMonthlySalaryRange,
  buildRemoteCount,
  buildSeniorityBreakdown,
  buildSkillTagFrequency,
  buildTopIndustries,
  buildTopTitles,
  buildTopTitleTrends,
  distinctCompanies,
  distinctCountries,
} from "@/lib/hiringAnalytics";
import { HiringKpiStrip } from "@/components/feature/hiring-analytics/HiringKpiStrip";
import type { HiringDashboardKpis } from "@/components/feature/hiring-analytics/HiringKpiStrip";
import { HeatmapTable } from "@/components/feature/hiring-analytics/HeatmapTable";
import { HorizontalBarChart } from "@/components/feature/hiring-analytics/HorizontalBarChart";
import { HiringSignalsFilterSidebar } from "@/components/feature/hiring-signals/HiringSignalsFilterSidebar";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";

const PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.info,
  CHART_COLORS.danger,
];

function donutFromNamed(
  rows: { name: string; value: number }[],
): { name: string; value: number; color: string }[] {
  return rows.map((r, i) => ({
    ...r,
    color: PALETTE[i % PALETTE.length]!,
  }));
}

export interface DemandsTrendsPageProps {
  hiring: {
    jobs: LinkedInJobRow[];
    loading: boolean;
    error: string | null;
    filters: JobListFilters;
    refetch: () => Promise<void>;
  };
  signalTimePreset: "all" | "new_7d";
}

export function DemandsTrendsPage({
  hiring,
  signalTimePreset,
}: DemandsTrendsPageProps) {
  const { jobs, loading, error, filters, refetch } = hiring;
  const { activeDraftCount } = useHireSignalFilter();
  const isDesktop = useIsDesktop();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const kpi: HiringDashboardKpis | null = useMemo(() => {
    const med = buildMedianSalary(jobs);
    return {
      total_jobs: jobs.length,
      jobs_with_salary: med.n,
      median_salary_min_usd: med.median ?? undefined,
      remote_count: buildRemoteCount(jobs),
      distinct_countries: distinctCountries(jobs),
      distinct_companies: distinctCompanies(jobs),
    };
  }, [jobs]);

  const daily = useMemo(() => buildDailyPostingsSeries(jobs), [jobs]);
  const locRows = useMemo(
    () =>
      buildLocationBreakdown(jobs, 20).map((r) => ({
        country: r.country,
        location: r.location,
        count: r.count,
      })),
    [jobs],
  );
  const countryDonut = useMemo(
    () => donutFromNamed(buildCountryBreakdown(jobs, 8)),
    [jobs],
  );
  const seniorityDonut = useMemo(
    () => donutFromNamed(buildSeniorityBreakdown(jobs)),
    [jobs],
  );
  const empDonut = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of jobs) {
      const raw = (j.employmentType || "").trim() || "Other";
      counts.set(raw, (counts.get(raw) ?? 0) + 1);
    }
    const rows = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
    return donutFromNamed(rows);
  }, [jobs]);

  const topTitles = useMemo(() => buildTopTitles(jobs, 12), [jobs]);
  const titleTrends = useMemo(() => buildTopTitleTrends(jobs, 5), [jobs]);
  const skillTags = useMemo(
    () =>
      buildSkillTagFrequency(jobs)
        .slice(0, 12)
        .map((s) => ({ name: s.tag, value: s.count })),
    [jobs],
  );
  const education = useMemo(() => buildEducationBreakdown(jobs), [jobs]);
  const expBuckets = useMemo(
    () => buildExperienceBucketBreakdown(jobs),
    [jobs],
  );
  const industries = useMemo(() => buildTopIndustries(jobs, 12), [jobs]);
  const monthlySal = useMemo(() => buildMonthlySalaryRange(jobs), [jobs]);

  const toolbar = (
    <DataToolbar
      cssPrefix="c360-toolbar"
      tabs={[
        {
          value: "demands",
          label: "Overview",
          count: jobs.length,
          showCountOnlyWhenActive: false,
        },
      ]}
      activeTab="demands"
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
  );

  const heatRows = locRows as unknown as Record<string, unknown>[];

  return (
    <DashboardPageLayout>
      {error ? (
        <p className="c360-mb-4 c360-text-sm c360-text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <DataPageLayout
        className="c360-demands-trends-page"
        showFilters
        mobileFiltersOpen={mobileFiltersOpen}
        onMobileFiltersClose={() => setMobileFiltersOpen(false)}
        filtersAriaLabel="Hiring signal filters"
        filterDrawerTitleId="c360-demands-filter-drawer-title"
        filtersPeekRail
        filtersPeekScope="hiring-signals"
        toolbar={toolbar}
        filters={
          <HiringSignalsFilterSidebar
            drawerTitleId="c360-demands-filter-drawer-title"
            appliedListFilters={filters}
            signalTimePreset={signalTimePreset}
            appliedRunId={filters.runId}
          />
        }
      >
        <div className="c360-section-stack">
          <HiringKpiStrip data={kpi} loading={loading} />

          <div className="c360-2col-grid">
            <Card title="Top locations" subtitle="Country · city">
              <HeatmapTable
                rows={heatRows}
                columns={[
                  { id: "country", header: "Country" },
                  { id: "location", header: "Location" },
                  {
                    id: "count",
                    header: "Postings",
                    heatmap: true,
                    align: "right",
                  },
                ]}
                valueKey="count"
              />
            </Card>
            <Card title="Daily postings" subtitle="UTC day from posted date">
              <div className="c360-hs-chart" style={{ height: 320 }}>
                {daily.length === 0 ? (
                  <p className="c360-text-sm c360-text-muted">No dated rows.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={daily} margin={RECHARTS_DEFAULTS.margin}>
                      <CartesianGrid
                        {...RECHARTS_DEFAULTS.cartesianGridProps}
                      />
                      <XAxis
                        dataKey="day"
                        {...RECHARTS_DEFAULTS.axisProps}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        {...RECHARTS_DEFAULTS.axisProps}
                      />
                      <Tooltip
                        contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle}
                      />
                      <Bar
                        dataKey="count"
                        fill={CHART_COLORS.primary}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          <div className="c360-2col-grid lg:c360-grid-cols-3">
            <Card title="Country">
              <div className="c360-hs-chart c360-hs-chart--pie">
                {countryDonut.length === 0 ? (
                  <p className="c360-text-sm c360-text-muted">No countries.</p>
                ) : (
                  <DonutChart data={countryDonut} height={220} />
                )}
              </div>
            </Card>
            <Card title="Seniority">
              <div className="c360-hs-chart c360-hs-chart--pie">
                {seniorityDonut.length === 0 ? (
                  <p className="c360-text-sm c360-text-muted">No seniority.</p>
                ) : (
                  <DonutChart data={seniorityDonut} height={220} />
                )}
              </div>
            </Card>
            <Card title="Employment type">
              <div className="c360-hs-chart c360-hs-chart--pie">
                {empDonut.length === 0 ? (
                  <p className="c360-text-sm c360-text-muted">No types.</p>
                ) : (
                  <DonutChart data={empDonut} height={220} />
                )}
              </div>
            </Card>
          </div>

          <div className="c360-2col-grid">
            <Card title="Top titles">
              <HorizontalBarChart data={topTitles} height={320} />
            </Card>
            <Card title="Top skill tags">
              <HorizontalBarChart data={skillTags} height={320} />
            </Card>
          </div>

          <div className="c360-2col-grid lg:c360-grid-cols-3">
            <Card title="Education (min)">
              <HorizontalBarChart data={education} height={260} />
            </Card>
            <Card title="Experience bucket">
              <HorizontalBarChart data={expBuckets} height={260} />
            </Card>
            <Card title="Top industries">
              <HorizontalBarChart data={industries} height={260} />
            </Card>
          </div>

          <Card title="Monthly salary range" subtitle="Median min / max USD">
            <div className="c360-hs-chart" style={{ height: 280 }}>
              {monthlySal.length === 0 ? (
                <p className="c360-text-sm c360-text-muted">No salary data.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlySal}
                    margin={RECHARTS_DEFAULTS.margin}
                  >
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

          <Card
            title="Posting trends by title"
            subtitle="Top 5 titles · monthly"
          >
            <div className="c360-hs-chart" style={{ height: 320 }}>
              {titleTrends.chartData.length === 0 ? (
                <p className="c360-text-sm c360-text-muted">Not enough data.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={titleTrends.chartData}
                    margin={RECHARTS_DEFAULTS.margin}
                  >
                    <CartesianGrid {...RECHARTS_DEFAULTS.cartesianGridProps} />
                    <XAxis
                      dataKey="month"
                      {...RECHARTS_DEFAULTS.axisProps}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      {...RECHARTS_DEFAULTS.axisProps}
                    />
                    <Tooltip
                      contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle}
                    />
                    {titleTrends.titleKeys.map((t, i) => (
                      <Line
                        key={t}
                        type="monotone"
                        dataKey={t}
                        stroke={PALETTE[i % PALETTE.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <p className="c360-text-xs c360-text-muted">
            Hiring signal data from LinkedIn via Contact360.
          </p>
        </div>
      </DataPageLayout>
    </DashboardPageLayout>
  );
}

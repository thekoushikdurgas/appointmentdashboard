"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/shared/DonutChart";
import { HIRING_SIGNALS_PAGE_NAME } from "@/lib/productNames";
import { ROUTES } from "@/lib/routes";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import {
  buildWeeklyPostingsSeries,
  buildEmploymentTypeBreakdown,
} from "@/components/feature/hiring-signals/HiringSignalCharts";
import {
  buildSkillTagFrequency,
  buildSeniorityBreakdown,
  buildEducationBreakdown,
  buildBenefitFrequency,
  buildMonthlySalaryRange,
} from "@/lib/hiringAnalytics";
import { HorizontalBarChart } from "@/components/feature/hiring-analytics/HorizontalBarChart";
import { CHART_COLORS, RECHARTS_DEFAULTS } from "@/lib/chartTheme";
import { Skeleton } from "@/components/shared/Skeleton";

export interface CompanyHiringTabProps {
  jobs: LinkedInJobRow[];
  loading: boolean;
}

export function CompanyHiringTab({ jobs, loading }: CompanyHiringTabProps) {
  const weekly = useMemo(() => buildWeeklyPostingsSeries(jobs), [jobs]);
  const empDonut = useMemo(() => buildEmploymentTypeBreakdown(jobs), [jobs]);
  const skillFreq = useMemo(
    () => buildSkillTagFrequency(jobs).slice(0, 10),
    [jobs],
  );
  const skillBars = useMemo(
    () => skillFreq.map((s) => ({ name: s.tag, value: s.count })),
    [skillFreq],
  );
  const seniority = useMemo(() => buildSeniorityBreakdown(jobs), [jobs]);
  const education = useMemo(() => buildEducationBreakdown(jobs), [jobs]);
  const benefits = useMemo(() => buildBenefitFrequency(jobs, 10), [jobs]);
  const monthlySal = useMemo(() => buildMonthlySalaryRange(jobs), [jobs]);

  const salaryChartData = useMemo(
    () =>
      monthlySal.map((m) => ({
        month: m.month,
        medianMin: m.medianMin ?? null,
        medianMax: m.medianMax ?? null,
      })),
    [monthlySal],
  );

  if (loading) {
    return (
      <div className="c360-section-stack">
        <Skeleton height={320} />
        <Skeleton height={320} />
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <Card title={HIRING_SIGNALS_PAGE_NAME}>
        <div className="c360-empty-state c360-section-stack">
          <p className="c360-text-sm c360-text-muted">
            No LinkedIn hiring postings matched this company in Contact360 yet.
          </p>
          <Link href={ROUTES.HIRING_SIGNALS} className="c360-link">
            Browse hiring signals →
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="c360-section-stack">
      <div className="c360-2col-grid c360-hs-dashboard-2col">
        <Card
          title="Postings by week"
          subtitle="Monday buckets from posting dates"
        >
          <div className="c360-hs-chart" style={{ height: 280 }}>
            {weekly.length === 0 ? (
              <p className="c360-text-sm c360-text-muted">Not enough dates.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekly} margin={RECHARTS_DEFAULTS.margin}>
                  <CartesianGrid {...RECHARTS_DEFAULTS.cartesianGridProps} />
                  <XAxis
                    dataKey="week"
                    {...RECHARTS_DEFAULTS.axisProps}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    {...RECHARTS_DEFAULTS.axisProps}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS.primary}
                    fill={CHART_COLORS.primary}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card title="Employment type" subtitle="Share of postings">
          <div className="c360-hs-chart c360-hs-chart--pie">
            {empDonut.length === 0 ? (
              <p className="c360-text-sm c360-text-muted">No types.</p>
            ) : (
              <DonutChart data={empDonut} height={260} showLegend />
            )}
          </div>
        </Card>
      </div>

      <Card title="Top skill tags" subtitle="Distinct tags (deduped per job)">
        {skillBars.length === 0 ? (
          <p className="c360-text-sm c360-text-muted">
            No skill tags on these postings.
          </p>
        ) : (
          <HorizontalBarChart data={skillBars} height={320} />
        )}
      </Card>

      <div className="c360-2col-grid">
        <Card title="Seniority">
          <HorizontalBarChart data={seniority} height={280} />
        </Card>
        <Card title="Education (minimum)">
          <HorizontalBarChart data={education} height={280} />
        </Card>
      </div>

      {benefits.length > 0 ? (
        <Card title="Benefits mentions">
          <HorizontalBarChart data={benefits} height={260} />
        </Card>
      ) : null}

      <Card
        title="Monthly salary range"
        subtitle="Median min / max USD where populated"
      >
        <div className="c360-hs-chart" style={{ height: 300 }}>
          {salaryChartData.length === 0 ||
          !salaryChartData.some(
            (r) => r.medianMin != null || r.medianMax != null,
          ) ? (
            <p className="c360-text-sm c360-text-muted">
              No salary figures on these postings.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salaryChartData}
                margin={RECHARTS_DEFAULTS.margin}
              >
                <CartesianGrid {...RECHARTS_DEFAULTS.cartesianGridProps} />
                <XAxis
                  dataKey="month"
                  {...RECHARTS_DEFAULTS.axisProps}
                  tick={{ fontSize: 11 }}
                />
                <YAxis {...RECHARTS_DEFAULTS.axisProps} />
                <Tooltip contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle} />
                <Line
                  type="monotone"
                  dataKey="medianMin"
                  name="Median min"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="medianMax"
                  name="Median max"
                  stroke={CHART_COLORS.accent}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <p className="c360-text-xs c360-text-muted">
        Hiring signal data from LinkedIn via Contact360.
      </p>
    </div>
  );
}

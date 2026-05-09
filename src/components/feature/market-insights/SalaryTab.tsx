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
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import {
  buildExperienceBucketBreakdown,
  buildMedianSalaryMinByExperienceBucket,
  buildMonthlySalaryRange,
} from "@/lib/hiringAnalytics";
import { HorizontalBarChart } from "@/components/feature/hiring-analytics/HorizontalBarChart";
import { CHART_COLORS, RECHARTS_DEFAULTS } from "@/lib/chartTheme";

export function SalaryTab({ jobs }: { jobs: LinkedInJobRow[] }) {
  const byExpSalary = useMemo(
    () => buildMedianSalaryMinByExperienceBucket(jobs),
    [jobs],
  );
  const monthly = useMemo(() => buildMonthlySalaryRange(jobs), [jobs]);
  const expCounts = useMemo(() => buildExperienceBucketBreakdown(jobs), [jobs]);

  const salaryFmt = byExpSalary.map((x) => ({
    name: x.name,
    value: Math.round(x.value),
  }));

  return (
    <div className="c360-section-stack">
      <Card
        title="Annual salary by experience"
        subtitle="Median salary_min_usd per bucket (USD)"
      >
        <HorizontalBarChart data={salaryFmt} height={300} />
      </Card>
      <Card title="Monthly salary range" subtitle="Median min / max">
        <div className="c360-hs-chart" style={{ height: 280 }}>
          {monthly.length === 0 ? (
            <p className="c360-text-sm c360-text-muted">No salary data.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={RECHARTS_DEFAULTS.margin}>
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
      <Card title="Experience bucket vs postings">
        <HorizontalBarChart data={expCounts} height={280} />
      </Card>
    </div>
  );
}

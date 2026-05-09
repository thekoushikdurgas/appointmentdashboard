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
  buildEducationBreakdown,
  buildSeniorityBreakdown,
  buildSoftHardSkillBreakdown,
  buildTopSkillTrends,
} from "@/lib/hiringAnalytics";
import { HeatmapTable } from "@/components/feature/hiring-analytics/HeatmapTable";
import { HorizontalBarChart } from "@/components/feature/hiring-analytics/HorizontalBarChart";
import { CHART_COLORS, RECHARTS_DEFAULTS } from "@/lib/chartTheme";

const PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.info,
];

export function SkillsTab({ jobs }: { jobs: LinkedInJobRow[] }) {
  const split = useMemo(() => buildSoftHardSkillBreakdown(jobs), [jobs]);
  const softTrend = useMemo(() => buildTopSkillTrends(jobs, "soft", 5), [jobs]);
  const hardTrend = useMemo(() => buildTopSkillTrends(jobs, "hard", 5), [jobs]);
  const education = useMemo(() => buildEducationBreakdown(jobs), [jobs]);
  const seniority = useMemo(() => buildSeniorityBreakdown(jobs), [jobs]);

  const softRows = useMemo(() => {
    const total = jobs.length || 1;
    return split.soft.map((s) => ({
      skill: s.name,
      count: s.value,
      pct: Math.round((s.value / total) * 1000) / 10,
    }));
  }, [split.soft, jobs.length]);

  const hardRows = useMemo(() => {
    const total = jobs.length || 1;
    return split.hard.map((s) => ({
      skill: s.name,
      count: s.value,
      pct: Math.round((s.value / total) * 1000) / 10,
    }));
  }, [split.hard, jobs.length]);

  const softBars = useMemo(
    () => split.soft.map((s) => ({ name: s.name, value: s.value })),
    [split.soft],
  );
  const hardBars = useMemo(
    () => split.hard.map((s) => ({ name: s.name, value: s.value })),
    [split.hard],
  );

  return (
    <div className="c360-section-stack">
      <div className="c360-2col-grid">
        <Card title="Top soft skills">
          <HeatmapTable
            rows={softRows as unknown as Record<string, unknown>[]}
            columns={[
              { id: "skill", header: "Skill" },
              {
                id: "count",
                header: "Jobs",
                heatmap: true,
                align: "right",
              },
              { id: "pct", header: "% of jobs", align: "right" },
            ]}
            valueKey="count"
          />
        </Card>
        <Card title="Top hard skills">
          <HeatmapTable
            rows={hardRows as unknown as Record<string, unknown>[]}
            columns={[
              { id: "skill", header: "Skill" },
              {
                id: "count",
                header: "Jobs",
                heatmap: true,
                align: "right",
              },
              { id: "pct", header: "% of jobs", align: "right" },
            ]}
            valueKey="count"
          />
        </Card>
      </div>
      <Card
        title="Soft skills (% of job postings)"
        subtitle="Approximate share"
      >
        <HorizontalBarChart data={softBars} showPercent height={280} />
      </Card>
      <Card
        title="Hard skills (% of job postings)"
        subtitle="Approximate share"
      >
        <HorizontalBarChart data={hardBars} showPercent height={280} />
      </Card>
      <Card title="Skill trends — soft" subtitle="Top 5 · monthly">
        <div className="c360-hs-chart" style={{ height: 280 }}>
          {softTrend.chartData.length === 0 ? (
            <p className="c360-text-sm c360-text-muted">No soft skill tags.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={softTrend.chartData}
                margin={RECHARTS_DEFAULTS.margin}
              >
                <CartesianGrid {...RECHARTS_DEFAULTS.cartesianGridProps} />
                <XAxis
                  dataKey="month"
                  {...RECHARTS_DEFAULTS.axisProps}
                  tick={{ fontSize: 10 }}
                />
                <YAxis allowDecimals={false} {...RECHARTS_DEFAULTS.axisProps} />
                <Tooltip contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle} />
                {softTrend.skillKeys.map((t, i) => (
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
      <Card title="Skill trends — hard" subtitle="Top 5 · monthly">
        <div className="c360-hs-chart" style={{ height: 280 }}>
          {hardTrend.chartData.length === 0 ? (
            <p className="c360-text-sm c360-text-muted">No hard skill tags.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={hardTrend.chartData}
                margin={RECHARTS_DEFAULTS.margin}
              >
                <CartesianGrid {...RECHARTS_DEFAULTS.cartesianGridProps} />
                <XAxis
                  dataKey="month"
                  {...RECHARTS_DEFAULTS.axisProps}
                  tick={{ fontSize: 10 }}
                />
                <YAxis allowDecimals={false} {...RECHARTS_DEFAULTS.axisProps} />
                <Tooltip contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle} />
                {hardTrend.skillKeys.map((t, i) => (
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
      <div className="c360-2col-grid">
        <Card title="Education level">
          <HorizontalBarChart data={education} height={260} />
        </Card>
        <Card title="Seniority level">
          <HorizontalBarChart data={seniority} height={260} />
        </Card>
      </div>
      <p className="c360-text-xs c360-text-muted">
        Based on LinkedIn-derived hiring signals in Contact360.
      </p>
    </div>
  );
}

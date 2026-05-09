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
import { buildTopTitles, buildTopTitleTrends } from "@/lib/hiringAnalytics";
import { HeatmapTable } from "@/components/feature/hiring-analytics/HeatmapTable";
import { CHART_COLORS, RECHARTS_DEFAULTS } from "@/lib/chartTheme";

const PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.info,
];

export function TitlesTab({ jobs }: { jobs: LinkedInJobRow[] }) {
  const titles = useMemo(() => buildTopTitles(jobs, 20), [jobs]);
  const trends = useMemo(() => buildTopTitleTrends(jobs, 5), [jobs]);

  const rows = useMemo(() => {
    const total = jobs.length || 1;
    return titles.map((t) => ({
      title: t.name,
      count: t.value,
      pct: Math.round((t.value / total) * 1000) / 10,
    }));
  }, [titles, jobs.length]);

  return (
    <div className="c360-section-stack">
      <Card title="Title overview">
        <HeatmapTable
          rows={rows as unknown as Record<string, unknown>[]}
          columns={[
            { id: "title", header: "Title" },
            {
              id: "count",
              header: "Postings",
              heatmap: true,
              align: "right",
            },
            { id: "pct", header: "%", align: "right" },
          ]}
          valueKey="count"
        />
      </Card>
      <Card title="Posting trends by title" subtitle="Top 5 · monthly">
        <div className="c360-hs-chart" style={{ height: 320 }}>
          {trends.chartData.length === 0 ? (
            <p className="c360-text-sm c360-text-muted">Not enough data.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trends.chartData}
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
                {trends.titleKeys.map((t, i) => (
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
        Based on LinkedIn-derived hiring signals in Contact360.
      </p>
    </div>
  );
}

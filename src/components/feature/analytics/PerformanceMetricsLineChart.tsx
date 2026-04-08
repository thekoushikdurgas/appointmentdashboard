"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { CHART_COLORS, RECHARTS_DEFAULTS } from "@/lib/chartTheme";
import type { PerformanceMetricRow } from "@/services/graphql/analyticsService";
import { useCSSVars } from "@/hooks/useCSSVars";

export interface PerformanceChartPoint {
  label: string;
  value: number;
}

/** Daily average of metric values for a stable line chart. */
export function bucketMetricsByDay(
  rows: PerformanceMetricRow[],
): PerformanceChartPoint[] {
  const map = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const d = new Date(r.timestamp ?? r.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    const cur = map.get(key) ?? { sum: 0, n: 0 };
    cur.sum += r.metricValue;
    cur.n += 1;
    map.set(key, cur);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([iso, { sum, n }]) => ({
      label: new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: n ? sum / n : 0,
    }));
}

interface PerformanceMetricsLineChartProps {
  rows: PerformanceMetricRow[];
  /** Y-axis label / tooltip series name */
  seriesName: string;
  height?: number;
  emptyLabel?: string;
}

export function PerformanceMetricsLineChart({
  rows,
  seriesName,
  height = 260,
  emptyLabel = "No samples in this range",
}: PerformanceMetricsLineChartProps) {
  const data = bucketMetricsByDay(rows);
  const emptyRef = useCSSVars<HTMLDivElement>({
    "--c360-empty-chart-h": `${height}px`,
  });

  if (data.length === 0) {
    return (
      <div ref={emptyRef} className="c360-empty-chart">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={RECHARTS_DEFAULTS.margin}>
        <CartesianGrid {...RECHARTS_DEFAULTS.cartesianGridProps} />
        <XAxis dataKey="label" {...RECHARTS_DEFAULTS.axisProps} />
        <YAxis {...RECHARTS_DEFAULTS.axisProps} />
        <Tooltip contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle} />
        <Line
          type="monotone"
          dataKey="value"
          name={seriesName}
          stroke={CHART_COLORS.primary}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: CHART_COLORS.primary }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

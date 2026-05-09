"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, RECHARTS_DEFAULTS } from "@/lib/chartTheme";
import { cn } from "@/lib/utils";

export type HBarDatum = { name: string; value: number };

export interface HorizontalBarChartProps {
  data: HBarDatum[];
  color?: string;
  showPercent?: boolean;
  /** Sum for percent mode; defaults to sum of values. */
  total?: number;
  className?: string;
  height?: number;
}

export function HorizontalBarChart({
  data,
  color = CHART_COLORS.primary,
  showPercent,
  total,
  className,
  height = 280,
}: HorizontalBarChartProps) {
  const sum =
    total ??
    data.reduce((s, d) => s + (Number.isFinite(d.value) ? d.value : 0), 0);
  const chartData = showPercent
    ? data.map((d) => ({
        ...d,
        pct: sum > 0 ? Math.round((d.value / sum) * 1000) / 10 : 0,
      }))
    : data;

  if (!chartData.length) {
    return (
      <p className={cn("c360-text-sm c360-text-muted", className)}>No data.</p>
    );
  }

  return (
    <div className={cn("c360-hs-chart", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ ...RECHARTS_DEFAULTS.margin, left: 8, right: 16 }}
        >
          <CartesianGrid {...RECHARTS_DEFAULTS.cartesianGridProps} />
          <XAxis
            type="number"
            allowDecimals={showPercent ? true : false}
            {...RECHARTS_DEFAULTS.axisProps}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            {...RECHARTS_DEFAULTS.axisProps}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle}
            formatter={(val: number | string) =>
              showPercent ? `${val}%` : val
            }
          />
          <Bar
            dataKey={showPercent ? "pct" : "value"}
            fill={color}
            radius={[0, 4, 4, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

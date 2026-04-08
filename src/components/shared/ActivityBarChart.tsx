"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { CHART_COLORS, RECHARTS_DEFAULTS } from "@/lib/chartTheme";
import { useCSSVars } from "@/hooks/useCSSVars";

export interface ActivityBarDatum {
  label: string;
  value: number;
}

interface ActivityBarChartProps {
  height?: number;
  /** When set, renders this series instead of an empty placeholder. */
  data?: ActivityBarDatum[];
  valueLabel?: string;
}

export function ActivityBarChart({
  height = 260,
  data,
  valueLabel = "Count",
}: ActivityBarChartProps) {
  const rows = data?.filter((d) => d.value > 0) ?? [];
  const emptyRef = useCSSVars<HTMLDivElement>({
    "--c360-chart-empty-h": `${height}px`,
  });

  if (rows.length === 0) {
    return (
      <div ref={emptyRef} className="c360-activity-bar-empty">
        <p className="c360-page-subtitle c360-m-0">
          No activity breakdown to display. Pass{" "}
          <code className="c360-text-xs">data</code> from{" "}
          <code className="c360-text-xs">activityStats</code> (e.g. by service
          type) when wiring this chart.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={RECHARTS_DEFAULTS.margin} barSize={18}>
        <CartesianGrid {...RECHARTS_DEFAULTS.cartesianGridProps} />
        <XAxis dataKey="label" {...RECHARTS_DEFAULTS.axisProps} />
        <YAxis {...RECHARTS_DEFAULTS.axisProps} allowDecimals={false} />
        <Tooltip contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle} />
        <Bar
          dataKey="value"
          name={valueLabel}
          fill={CHART_COLORS.primary}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

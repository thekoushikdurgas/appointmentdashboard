"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_SERIES, RECHARTS_DEFAULTS } from "@/lib/chartTheme";

export interface DonutChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
}

export function DonutChart({
  data,
  height = 240,
  innerRadius = 60,
  outerRadius = 90,
  showLegend = true,
}: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={entry.color || CHART_SERIES[index % CHART_SERIES.length]}
            />
          ))}
        </Pie>
        <Tooltip contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle} />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontFamily: "Poppins, sans-serif", fontSize: 12 }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

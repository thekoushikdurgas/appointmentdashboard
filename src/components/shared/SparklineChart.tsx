"use client";

import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

interface SparklineChartProps {
  data: Array<{ value: number }>;
  color?: string;
  height?: number;
  showTooltip?: boolean;
}

/**
 * Compact inline sparkline using recharts AreaChart.
 * Axes hidden — used inside stat cards and widgets.
 */
export function SparklineChart({
  data,
  color = "var(--c360-primary)",
  height = 40,
  showTooltip = false,
}: SparklineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient
            id={`spark-${color.replace(/[^a-z0-9]/gi, "")}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showTooltip && (
          <Tooltip
            contentStyle={{
              background: "var(--c360-card-bg)",
              border: "1px solid var(--c360-border)",
              borderRadius: "var(--c360-radius-sm)",
              fontSize: 12,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, "")})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

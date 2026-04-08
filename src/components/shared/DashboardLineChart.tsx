"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_COLORS, RECHARTS_DEFAULTS } from "@/lib/chartTheme";

const generateDays = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      finder: Math.floor(Math.random() * 120 + 20),
      verifier: Math.floor(Math.random() * 200 + 50),
    };
  });

const DATA = generateDays(30);

export function DashboardLineChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={DATA} margin={RECHARTS_DEFAULTS.margin}>
        <CartesianGrid {...RECHARTS_DEFAULTS.cartesianGridProps} />
        <XAxis
          dataKey="date"
          {...RECHARTS_DEFAULTS.axisProps}
          tickFormatter={(v: string) => v.split(" ")[1]}
          interval={4}
        />
        <YAxis {...RECHARTS_DEFAULTS.axisProps} />
        <Tooltip contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle} />
        <Legend
          wrapperStyle={{ fontFamily: "Poppins, sans-serif", fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="finder"
          name="Email Finder"
          stroke={CHART_COLORS.primary}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: CHART_COLORS.primary }}
        />
        <Line
          type="monotone"
          dataKey="verifier"
          name="Verifier"
          stroke={CHART_COLORS.accent}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: CHART_COLORS.accent }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

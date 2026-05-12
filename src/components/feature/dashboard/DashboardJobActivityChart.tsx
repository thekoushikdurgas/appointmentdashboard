"use client";

import type { CSSProperties } from "react";
import { useId, useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, rgbaFromHex } from "@/lib/chartTheme";
import { cn } from "@/lib/utils";
import type { JobActivityPoint } from "@/lib/dashboardJobActivitySeries";

function JobActivityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: number | string;
    color?: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="c360-dashboard-job-chart__tooltip">
      <div className="c360-dashboard-job-chart__tooltip-date">{label}</div>
      {payload.map((item) => {
        const nameStyle: CSSProperties = { color: item.color };
        return (
          <div
            key={String(item.dataKey ?? item.name)}
            className="c360-dashboard-job-chart__tooltip-row"
          >
            <span style={nameStyle}>{item.name}</span>
            <span className="c360-dashboard-job-chart__tooltip-value">
              {typeof item.value === "number"
                ? item.value.toLocaleString()
                : item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export interface DashboardJobActivityChartProps {
  data: JobActivityPoint[];
}

export function DashboardJobActivityChart({
  data,
}: DashboardJobActivityChartProps) {
  const uid = useId().replace(/:/g, "");
  const lineGlowId = `c360-job-activity-glow-${uid}`;

  const metrics = useMemo(() => {
    if (!data.length) {
      return {
        totalCombined: 0,
        latestCombined: 0,
        firstCombined: 0,
        highCombined: 0,
        lowCombined: 0,
        peakDate: "",
        trendPct: 0,
        latestPosted: 0,
        latestSalaryListed: 0,
        todaysLabel: "Latest",
      };
    }
    const combined = data.map((r) => r.posted + r.salaryListed);
    const totalCombined = combined.reduce((a, b) => a + b, 0);
    const latestCombined = combined[combined.length - 1] ?? 0;
    const firstCombined = combined[0] ?? 0;
    const highCombined = Math.max(...combined);
    const lowCombined = Math.min(...combined);
    let peakIdx = 0;
    for (let i = 1; i < combined.length; i++) {
      if (combined[i] > combined[peakIdx]) peakIdx = i;
    }
    const peakDate = data[peakIdx]?.date ?? "";
    const denom = Math.max(firstCombined, 1);
    const trendPct = Math.round(
      ((latestCombined - firstCombined) / denom) * 100,
    );
    const last = data[data.length - 1];
    return {
      totalCombined,
      latestCombined,
      firstCombined,
      highCombined,
      lowCombined,
      peakDate,
      trendPct,
      latestPosted: last?.posted ?? 0,
      latestSalaryListed: last?.salaryListed ?? 0,
      todaysLabel: data.length <= 12 ? "Latest bucket" : "Latest day",
    };
  }, [data]);

  const trendUp = metrics.trendPct >= 0;

  if (!data.length) {
    return (
      <p className="c360-text-sm c360-text-muted c360-m-0">
        No chart data yet.
      </p>
    );
  }

  const primaryRgb = rgbaFromHex(CHART_COLORS.primary, 0.35);
  const legendPrimarySwatch: CSSProperties = {
    background: CHART_COLORS.primary,
  };
  const legendAccentSwatch: CSSProperties = {
    background: CHART_COLORS.accent,
  };

  return (
    <div className="c360-dashboard-job-chart">
      <div className="c360-dashboard-job-chart__hero">
        <p className="c360-dashboard-job-chart__eyebrow">
          Hiring signal volume ({data.length} days)
        </p>
        <div className="c360-dashboard-job-chart__hero-row">
          <span className="c360-dashboard-job-chart__kpi">
            {metrics.totalCombined.toLocaleString()}
          </span>
          <div
            className={cn(
              "c360-dashboard-job-chart__trend",
              trendUp
                ? "c360-dashboard-job-chart__trend--up"
                : "c360-dashboard-job-chart__trend--down",
            )}
          >
            {trendUp ? (
              <TrendingUp size={16} aria-hidden />
            ) : (
              <TrendingDown size={16} aria-hidden />
            )}
            <span>
              {trendUp ? "+" : ""}
              {metrics.trendPct}%
            </span>
            <span className="c360-dashboard-job-chart__trend-context">
              vs. first day
            </span>
          </div>
        </div>
      </div>

      <div className="c360-dashboard-job-chart__stats-row">
        <div className="c360-dashboard-job-chart__stats-left">
          <span className="c360-text-muted">{metrics.todaysLabel}:</span>
          <span className="c360-dashboard-job-chart__stat-strong">
            {metrics.latestPosted.toLocaleString()} posted ·{" "}
            {metrics.latestSalaryListed.toLocaleString()} salary-listed
          </span>
          <span
            className={cn(
              trendUp
                ? "c360-dashboard-job-chart__stat-change--up"
                : "c360-dashboard-job-chart__stat-change--down",
            )}
          >
            ({trendUp ? "+" : ""}
            {metrics.trendPct}%)
          </span>
        </div>
        <div className="c360-dashboard-job-chart__stats-right">
          <span>
            High:{" "}
            <span className="c360-dashboard-job-chart__stat-high">
              {metrics.highCombined.toLocaleString()}
            </span>
          </span>
          <span>
            Low:{" "}
            <span className="c360-dashboard-job-chart__stat-low">
              {metrics.lowCombined.toLocaleString()}
            </span>
          </span>
          <span>
            Δ:{" "}
            <span
              className={cn(
                trendUp
                  ? "c360-dashboard-job-chart__stat-change--up"
                  : "c360-dashboard-job-chart__stat-change--down",
              )}
            >
              {trendUp ? "+" : ""}
              {metrics.latestCombined - metrics.firstCombined}
            </span>
          </span>
        </div>
      </div>

      <div
        className="c360-dashboard-job-chart__legend"
        aria-label="Chart series"
      >
        <span className="c360-dashboard-job-chart__legend-item">
          <span
            className="c360-dashboard-job-chart__legend-swatch"
            style={legendPrimarySwatch}
            aria-hidden
          />
          Jobs posted
        </span>
        <span className="c360-dashboard-job-chart__legend-item">
          <span
            className="c360-dashboard-job-chart__legend-swatch"
            style={legendAccentSwatch}
            aria-hidden
          />
          With salary range
        </span>
      </div>

      <div className="c360-dashboard-job-chart__plot">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={data}
            margin={{ top: 16, right: 8, left: 0, bottom: 8 }}
          >
            <defs>
              <filter
                id={lineGlowId}
                x="-80%"
                y="-80%"
                width="260%"
                height="260%"
              >
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="4"
                  floodColor={primaryRgb}
                  floodOpacity={0.45}
                />
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="4 8"
              stroke="var(--c360-border)"
              strokeOpacity={0.9}
              horizontal
              vertical={false}
            />

            {metrics.peakDate ? (
              <ReferenceLine
                x={metrics.peakDate}
                stroke={CHART_COLORS.primary}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            ) : null}

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              width={44}
              allowDecimals={false}
            />

            <Tooltip
              content={<JobActivityTooltip />}
              cursor={{
                strokeDasharray: "3 3",
                stroke: "var(--c360-text-muted)",
                strokeOpacity: 0.45,
              }}
            />

            <Line
              type="monotone"
              dataKey="posted"
              name="Jobs posted"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: CHART_COLORS.primary,
                stroke: "#fff",
                strokeWidth: 2,
              }}
              filter={`url(#${lineGlowId})`}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="salaryListed"
              name="With salary range"
              stroke={CHART_COLORS.accent}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: CHART_COLORS.accent,
                stroke: "#fff",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

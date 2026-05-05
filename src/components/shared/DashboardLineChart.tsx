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

export interface EmailActivityPoint {
  date: string;
  finder: number;
  verifier: number;
}

/** Deterministic 30-day series (avoids SSR / hydration drift from Math.random). */
export function buildEmailActivityFallbackSeries(): EmailActivityPoint[] {
  const n = 30;
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    const t = i * 7 + 13;
    const finder = 30 + (t % 97);
    const verifier = 55 + ((t * 11) % 143);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      finder,
      verifier,
    };
  });
}

export function mapLiveDataToEmailActivity(
  points: ReadonlyArray<{ time: string; contacts: number; emails: number }>,
): EmailActivityPoint[] {
  return points.map((p) => ({
    date: p.time,
    finder: p.contacts,
    verifier: p.emails,
  }));
}

function EmailActivityTooltip({
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
    <div className="c360-dashboard-email-chart__tooltip">
      <div className="c360-dashboard-email-chart__tooltip-date">{label}</div>
      {payload.map((item) => {
        const nameStyle: CSSProperties = { color: item.color };
        return (
          <div
            key={String(item.dataKey ?? item.name)}
            className="c360-dashboard-email-chart__tooltip-row"
          >
            <span style={nameStyle}>{item.name}</span>
            <span className="c360-dashboard-email-chart__tooltip-value">
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

export interface EmailActivityChartProps {
  data: EmailActivityPoint[];
}

export function EmailActivityChart({ data }: EmailActivityChartProps) {
  const uid = useId().replace(/:/g, "");
  const lineGlowId = `c360-email-glow-${uid}`;

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
        latestFinder: 0,
        latestVerifier: 0,
        todaysLabel: "Latest",
      };
    }
    const combined = data.map((r) => r.finder + r.verifier);
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
      latestFinder: last?.finder ?? 0,
      latestVerifier: last?.verifier ?? 0,
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
    <div className="c360-dashboard-email-chart">
      <div className="c360-dashboard-email-chart__hero">
        <p className="c360-dashboard-email-chart__eyebrow">
          Combined volume ({data.length} data points)
        </p>
        <div className="c360-dashboard-email-chart__hero-row">
          <span className="c360-dashboard-email-chart__kpi">
            {metrics.totalCombined.toLocaleString()}
          </span>
          <div
            className={cn(
              "c360-dashboard-email-chart__trend",
              trendUp
                ? "c360-dashboard-email-chart__trend--up"
                : "c360-dashboard-email-chart__trend--down",
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
            <span className="c360-dashboard-email-chart__trend-context">
              vs. first bucket
            </span>
          </div>
        </div>
      </div>

      <div className="c360-dashboard-email-chart__stats-row">
        <div className="c360-dashboard-email-chart__stats-left">
          <span className="c360-text-muted">{metrics.todaysLabel}:</span>
          <span className="c360-dashboard-email-chart__stat-strong">
            {metrics.latestFinder.toLocaleString()} finds ·{" "}
            {metrics.latestVerifier.toLocaleString()} verifies
          </span>
          <span
            className={cn(
              trendUp
                ? "c360-dashboard-email-chart__stat-change--up"
                : "c360-dashboard-email-chart__stat-change--down",
            )}
          >
            ({trendUp ? "+" : ""}
            {metrics.trendPct}%)
          </span>
        </div>
        <div className="c360-dashboard-email-chart__stats-right">
          <span>
            High:{" "}
            <span className="c360-dashboard-email-chart__stat-high">
              {metrics.highCombined.toLocaleString()}
            </span>
          </span>
          <span>
            Low:{" "}
            <span className="c360-dashboard-email-chart__stat-low">
              {metrics.lowCombined.toLocaleString()}
            </span>
          </span>
          <span>
            Δ:{" "}
            <span
              className={cn(
                trendUp
                  ? "c360-dashboard-email-chart__stat-change--up"
                  : "c360-dashboard-email-chart__stat-change--down",
              )}
            >
              {trendUp ? "+" : ""}
              {metrics.latestCombined - metrics.firstCombined}
            </span>
          </span>
        </div>
      </div>

      <div
        className="c360-dashboard-email-chart__legend"
        aria-label="Chart series"
      >
        <span className="c360-dashboard-email-chart__legend-item">
          <span
            className="c360-dashboard-email-chart__legend-swatch"
            style={legendPrimarySwatch}
            aria-hidden
          />
          Email Finder
        </span>
        <span className="c360-dashboard-email-chart__legend-item">
          <span
            className="c360-dashboard-email-chart__legend-swatch"
            style={legendAccentSwatch}
            aria-hidden
          />
          Verifier
        </span>
      </div>

      <div className="c360-dashboard-email-chart__plot">
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
            />

            <Tooltip
              content={<EmailActivityTooltip />}
              cursor={{
                strokeDasharray: "3 3",
                stroke: "var(--c360-text-muted)",
                strokeOpacity: 0.45,
              }}
            />

            <Line
              type="monotone"
              dataKey="finder"
              name="Email Finder"
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
              dataKey="verifier"
              name="Verifier"
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

/** @deprecated Use EmailActivityChart + buildEmailActivityFallbackSeries */
export function DashboardLineChart() {
  return <EmailActivityChart data={buildEmailActivityFallbackSeries()} />;
}

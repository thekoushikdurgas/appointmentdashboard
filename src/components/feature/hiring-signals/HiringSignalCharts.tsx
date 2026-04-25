"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/shared/DonutChart";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import { CHART_COLORS, RECHARTS_DEFAULTS } from "@/lib/chartTheme";

function weekKey(iso: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const dayNum = String(monday.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

function normalizeEmploymentType(raw: string): string {
  const x = raw.trim().toLowerCase();
  if (!x) return "Other";
  if (x.includes("full")) return "Full-time";
  if (x.includes("contract")) return "Contract";
  if (x.includes("part")) return "Part-time";
  if (x.includes("remote")) return "Remote";
  return raw.trim() || "Other";
}

export function buildWeeklyPostingsSeries(jobs: LinkedInJobRow[]) {
  const counts = new Map<string, number>();
  for (const j of jobs) {
    const k = weekKey(j.postedAt);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const keys = [...counts.keys()].sort();
  return keys.map((week) => ({
    week,
    count: counts.get(week) ?? 0,
  }));
}

export function buildEmploymentTypeBreakdown(jobs: LinkedInJobRow[]) {
  const counts = new Map<string, number>();
  for (const j of jobs) {
    const label = normalizeEmploymentType(j.employmentType);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const palette = [
    CHART_COLORS.primary,
    CHART_COLORS.accent,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.info,
    CHART_COLORS.danger,
  ];
  return [...counts.entries()]
    .map(([name, value], i) => ({
      name,
      value,
      color: palette[i % palette.length],
    }))
    .sort((a, b) => b.value - a.value);
}

export interface HiringSignalChartsProps {
  jobs: LinkedInJobRow[];
  className?: string;
}

export function HiringSignalCharts({
  jobs,
  className,
}: HiringSignalChartsProps) {
  const weekly = useMemo(() => buildWeeklyPostingsSeries(jobs), [jobs]);
  const donut = useMemo(() => buildEmploymentTypeBreakdown(jobs), [jobs]);

  return (
    <div
      className={className ? `c360-2col-grid ${className}` : "c360-2col-grid"}
    >
      <Card
        title="Postings by week"
        subtitle="From visible job list (current fetch)"
      >
        <div className="c360-hs-chart">
          {weekly.length === 0 ? (
            <p className="c360-text-sm c360-text-muted">
              Not enough dated rows.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={RECHARTS_DEFAULTS.margin}>
                <CartesianGrid {...RECHARTS_DEFAULTS.cartesianGridProps} />
                <XAxis
                  dataKey="week"
                  {...RECHARTS_DEFAULTS.axisProps}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  {...RECHARTS_DEFAULTS.axisProps}
                  width={32}
                />
                <Tooltip contentStyle={RECHARTS_DEFAULTS.tooltipContentStyle} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Roles"
                  stroke={CHART_COLORS.primary}
                  fill={CHART_COLORS.primary}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
      <Card title="Employment type" subtitle="Distribution on visible job list">
        <div className="c360-hs-chart c360-hs-chart--pie">
          {donut.length === 0 ? (
            <p className="c360-text-sm c360-text-muted">No employment types.</p>
          ) : (
            <DonutChart data={donut} height={260} showLegend />
          )}
        </div>
      </Card>
    </div>
  );
}

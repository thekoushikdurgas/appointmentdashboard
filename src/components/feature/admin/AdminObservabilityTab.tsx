"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/shared/StatCard";
import { formatNumber } from "@/lib/utils";
import { jsonCountsToRows } from "@/lib/adminCharts";
import type { LogStatistics } from "@/graphql/generated/types";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Clock,
  RefreshCw,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TIME_RANGES = ["1h", "24h", "7d", "30d"] as const;

export type LogTimeRange = (typeof TIME_RANGES)[number];

const TOOLTIP = {
  background: "var(--c360-card-bg)",
  border: "1px solid var(--c360-border)",
  borderRadius: "var(--c360-radius-sm)",
  fontSize: 12,
};

interface AdminObservabilityTabProps {
  timeRange: LogTimeRange;
  onTimeRangeChange: (r: LogTimeRange) => void;
  stats: LogStatistics | null;
  loading: boolean;
  onRefresh: () => void;
}

export function AdminObservabilityTab({
  timeRange,
  onTimeRangeChange,
  stats,
  loading,
  onRefresh,
}: AdminObservabilityTabProps) {
  const byLevelRows = useMemo(
    () => (stats ? jsonCountsToRows(stats.byLevel, 16) : []),
    [stats],
  );

  const trendData = useMemo(
    () =>
      (stats?.performanceTrends ?? []).map((p) => ({
        t: new Date(p.time).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        avg: Math.round(p.avgDurationMs),
        p95: Math.round(p.p95DurationMs),
      })),
    [stats],
  );

  return (
    <div className="c360-section-stack">
      <Card
        title="Log observability"
        subtitle="SuperAdmin — admin.logStatistics(timeRange)"
        actions={
          <div className="c360-flex c360-gap-2 c360-flex-wrap">
            {TIME_RANGES.map((r) => (
              <label
                key={r}
                className="c360-flex c360-items-center c360-gap-1 c360-text-sm"
              >
                <input
                  type="radio"
                  name="admin-log-time-range"
                  checked={timeRange === r}
                  onChange={() => onTimeRangeChange(r)}
                  disabled={loading}
                />
                {r}
              </label>
            ))}
            <button
              type="button"
              className="c360-btn c360-btn--ghost c360-btn--sm c360-inline-flex c360-items-center c360-gap-1"
              onClick={() => onRefresh()}
              disabled={loading}
            >
              <RefreshCw
                size={14}
                className={cn(loading && "c360-spin")}
                aria-hidden
              />
              Refresh
            </button>
          </div>
        }
      >
        {loading && !stats ? (
          <p className="c360-page-subtitle">Loading log statistics…</p>
        ) : !stats ? (
          <p className="c360-page-subtitle">
            No data. You may need SuperAdmin access or the logs backend may be
            unavailable.
          </p>
        ) : (
          <>
            <div className="c360-dashboard-layout__stats c360-mb-6">
              <StatCard
                label="Total logs"
                value={formatNumber(stats.totalLogs)}
                icon={<BarChart2 size={20} />}
              />
              <StatCard
                label="Error rate"
                value={`${(stats.errorRate * 100).toFixed(2)}%`}
                icon={<AlertTriangle size={20} />}
              />
              <StatCard
                label="Avg response (ms)"
                value={formatNumber(Math.round(stats.avgResponseTimeMs))}
                icon={<Clock size={20} />}
              />
              <StatCard
                label="Slow queries"
                value={formatNumber(stats.slowQueriesCount)}
                icon={<Activity size={20} />}
              />
              <StatCard
                label="Active users (window)"
                value={formatNumber(stats.userActivity.activeUsers)}
                icon={<Users size={20} />}
              />
              <StatCard
                label="Req / user (avg)"
                value={stats.userActivity.requestsPerUserAvg.toFixed(1)}
                icon={<Users size={20} />}
              />
            </div>

            <div className="c360-section-stack c360-mb-6">
              <p className="c360-text-sm c360-text-muted c360-mb-2">
                Logs by level
              </p>
              {byLevelRows.length === 0 ? (
                <p className="c360-page-subtitle">No level breakdown.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byLevelRows}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--c360-border)"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "var(--c360-text-muted)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--c360-text-muted)" }}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={TOOLTIP} />
                    <Bar
                      dataKey="value"
                      name="Count"
                      fill="var(--c360-primary)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="c360-section-stack c360-mb-6">
              <p className="c360-text-sm c360-text-muted c360-mb-2">
                Performance trend
              </p>
              {trendData.length === 0 ? (
                <p className="c360-page-subtitle">No trend samples.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--c360-border)"
                    />
                    <XAxis
                      dataKey="t"
                      tick={{ fontSize: 10, fill: "var(--c360-text-muted)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--c360-text-muted)" }}
                    />
                    <Tooltip contentStyle={TOOLTIP} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avg"
                      name="Avg ms"
                      stroke="var(--c360-primary)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="p95"
                      name="P95 ms"
                      stroke="var(--c360-accent)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="c360-section-stack">
              <p className="c360-text-sm c360-text-muted c360-mb-2">
                Top errors
              </p>
              {stats.topErrors.length === 0 ? (
                <p className="c360-page-subtitle">None recorded.</p>
              ) : (
                <div className="c360-table-wrapper">
                  <table className="c360-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Count</th>
                        <th>Message</th>
                        <th>Last seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topErrors.map((e) => (
                        <tr key={`${e.type}-${e.message}`}>
                          <td className="c360-text-sm">{e.type}</td>
                          <td>{e.count}</td>
                          <td className="c360-text-sm c360-text-muted">
                            {e.message}
                          </td>
                          <td className="c360-text-xs c360-text-muted">
                            {new Date(e.lastSeen).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

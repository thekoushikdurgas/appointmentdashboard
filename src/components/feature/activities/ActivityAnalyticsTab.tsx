"use client";

import {
  AreaChart,
  Area,
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
import { Badge } from "@/components/ui/Badge";
import type { ActivityStats } from "@/graphql/generated/types";
import { humanizeToken } from "@/lib/activityDisplay";

const TOOLTIP_STYLE = {
  background: "var(--c360-card-bg)",
  border: "1px solid var(--c360-border)",
  borderRadius: "var(--c360-radius-sm)",
  fontSize: 12,
};

export interface AnalyticsDataPoint {
  date: string;
  emails: number;
  contacts: number;
  jobs: number;
}

export interface JobStatPoint {
  time: string;
  running: number;
  completed: number;
  failed: number;
}

function statsJsonToBars(
  json: unknown,
  max = 12,
): { label: string; value: number }[] {
  if (!json || typeof json !== "object") return [];
  return Object.entries(json as Record<string, unknown>)
    .map(([key, raw]) => ({
      label: humanizeToken(key),
      value: typeof raw === "number" ? raw : Number(raw) || 0,
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, max);
}

interface ActivityAnalyticsTabProps {
  analyticsData: AnalyticsDataPoint[];
  stats: ActivityStats | null;
  statsLoading?: boolean;
}

export function ActivityAnalyticsTab({
  analyticsData,
  stats,
  statsLoading,
}: ActivityAnalyticsTabProps) {
  const byService = stats ? statsJsonToBars(stats.byServiceType) : [];
  const byAction = stats ? statsJsonToBars(stats.byActionType) : [];
  const byStatus = stats ? statsJsonToBars(stats.byStatus, 6) : [];

  return (
    <div className="c360-section-stack">
      <Card
        title="7-day activity trend"
        subtitle="Grouped from the current result set (same filters as the feed)"
      >
        {analyticsData.length === 0 ? (
          <p className="c360-page-subtitle">
            Not enough dated rows in this page to plot a trend. Increase the
            limit or relax filters.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={analyticsData}>
              <defs>
                <linearGradient id="gEmails" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--c360-primary)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--c360-primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="gContacts" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--c360-success)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--c360-success)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--c360-border)"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--c360-text-muted)" }}
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--c360-text-muted)" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Area
                type="monotone"
                dataKey="emails"
                name="Email / search"
                stroke="var(--c360-primary)"
                fill="url(#gEmails)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="contacts"
                name="Contacts / imports"
                stroke="var(--c360-success)"
                fill="url(#gContacts)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card
        title="Totals from API stats"
        subtitle={
          statsLoading
            ? "Loading activityStats…"
            : "activityStats for the selected date range (if any)"
        }
      >
        {!stats && !statsLoading ? (
          <p className="c360-page-subtitle">No statistics loaded.</p>
        ) : statsLoading ? (
          <p className="c360-page-subtitle">Loading…</p>
        ) : (
          <div className="c360-section-stack c360-section-stack--sm">
            <p className="c360-text-sm">
              <strong>{stats!.totalActivities}</strong> total activities ·{" "}
              <strong>{stats!.recentActivities}</strong> in the last 24h (API)
            </p>
            <div className="c360-flex c360-flex-wrap c360-gap-4 c360-items-stretch">
              <div className="c360-activity-analytics-chart-col">
                <p className="c360-text-xs c360-text-muted c360-mb-2">
                  By service type
                </p>
                {byService.length === 0 ? (
                  <p className="c360-page-subtitle">No breakdown.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byService} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--c360-border)"
                      />
                      <XAxis
                        type="number"
                        tick={{
                          fontSize: 10,
                          fill: "var(--c360-text-muted)",
                        }}
                      />
                      <YAxis
                        dataKey="label"
                        type="category"
                        tick={{
                          fontSize: 10,
                          fill: "var(--c360-text-muted)",
                        }}
                        width={100}
                      />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar
                        dataKey="value"
                        name="Count"
                        fill="var(--c360-primary)"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="c360-activity-analytics-chart-col">
                <p className="c360-text-xs c360-text-muted c360-mb-2">
                  By action type
                </p>
                {byAction.length === 0 ? (
                  <p className="c360-page-subtitle">No breakdown.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byAction} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--c360-border)"
                      />
                      <XAxis
                        type="number"
                        tick={{
                          fontSize: 10,
                          fill: "var(--c360-text-muted)",
                        }}
                      />
                      <YAxis
                        dataKey="label"
                        type="category"
                        tick={{
                          fontSize: 10,
                          fill: "var(--c360-text-muted)",
                        }}
                        width={88}
                      />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar
                        dataKey="value"
                        name="Count"
                        fill="var(--c360-success)"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="c360-activity-analytics-chart-col--status">
                <p className="c360-text-xs c360-text-muted c360-mb-2">
                  By status
                </p>
                {byStatus.length === 0 ? (
                  <p className="c360-page-subtitle">No breakdown.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byStatus}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--c360-border)"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{
                          fontSize: 10,
                          fill: "var(--c360-text-muted)",
                        }}
                      />
                      <YAxis
                        tick={{
                          fontSize: 10,
                          fill: "var(--c360-text-muted)",
                        }}
                        allowDecimals={false}
                      />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar
                        dataKey="value"
                        name="Count"
                        fill="var(--c360-accent)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <p className="c360-text-xs c360-text-muted">
              Detailed email validation breakdowns (valid, catch-all, etc.) live
              in the Email module, not in activity aggregates.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

interface JobStatsTabProps {
  jobStats: JobStatPoint[];
}

export function JobStatsTab({ jobStats }: JobStatsTabProps) {
  return (
    <Card
      title="Live Job Statistics"
      subtitle="Polled every 10 seconds — running, completed, failed"
      actions={
        <Badge color="green" dot>
          Live
        </Badge>
      }
    >
      {jobStats.length === 0 ? (
        <div className="c360-empty-state">Waiting for first poll...</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={jobStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c360-border)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "var(--c360-text-muted)" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--c360-text-muted)" }}
              allowDecimals={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Line
              type="monotone"
              dataKey="running"
              name="Running"
              stroke="var(--c360-warning)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="var(--c360-success)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="failed"
              name="Failed"
              stroke="var(--c360-danger)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

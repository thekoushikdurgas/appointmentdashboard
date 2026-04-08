"use client";

import { Users, Activity, Zap, BarChart2, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { Skeleton } from "@/components/shared/Skeleton";
import { type AdminStats } from "@/services/graphql/adminService";
import type { LogStatistics } from "@/graphql/generated/types";
import { formatNumber } from "@/lib/utils";

interface AdminStatGridProps {
  stats: AdminStats | null;
  loading: boolean;
  logStats?: LogStatistics | null;
  logStatsLoading?: boolean;
}

export function AdminStatGrid({
  stats,
  loading,
  logStats,
  logStatsLoading,
}: AdminStatGridProps) {
  if (loading && !stats) {
    return (
      <div className="c360-widget-grid c360-mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={100} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const logLoading = logStatsLoading && !logStats;
  const totalLogsDisplay = logLoading
    ? "…"
    : logStats != null
      ? formatNumber(logStats.totalLogs)
      : "—";
  const errorRateDisplay =
    logLoading || logStats == null
      ? "—"
      : `${(logStats.errorRate * 100).toFixed(2)}%`;

  return (
    <div className="c360-widget-grid c360-mb-6">
      <StatCard
        label="Total Users"
        value={formatNumber(stats.totalUsers)}
        icon={<Users size={20} />}
      />
      <StatCard
        label="Active Users"
        value={formatNumber(stats.activeUsers)}
        icon={<Activity size={20} />}
      />
      <StatCard
        label="Roles on platform"
        value={String(
          typeof stats.usersByRole === "object" && stats.usersByRole !== null
            ? Object.keys(stats.usersByRole as Record<string, unknown>).length
            : 0,
        )}
        icon={<Users size={20} />}
      />
      <StatCard
        label="Subscription plans"
        value={String(
          typeof stats.usersByPlan === "object" && stats.usersByPlan !== null
            ? Object.keys(stats.usersByPlan as Record<string, unknown>).length
            : 0,
        )}
        icon={<Zap size={20} />}
      />
      <StatCard
        label="Logs (window)"
        value={totalLogsDisplay}
        icon={<BarChart2 size={20} />}
      />
      <StatCard
        label="Log error rate"
        value={errorRateDisplay}
        icon={<AlertTriangle size={20} />}
      />
    </div>
  );
}

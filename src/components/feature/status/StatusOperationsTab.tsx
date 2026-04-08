"use client";

import {
  Activity,
  Database,
  HardDrive,
  Zap,
  Clock,
  KeyRound,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/shared/Skeleton";
import type { PerformanceStats } from "@/graphql/generated/types";

interface StatusOperationsTabProps {
  data: PerformanceStats | null;
  loading: boolean;
  error: string | null;
}

export function StatusOperationsTab({
  data,
  loading,
  error,
}: StatusOperationsTabProps) {
  if (loading) {
    return <Skeleton height={400} className="c360-status-ops-skeleton" />;
  }

  if (error) {
    const isForbidden =
      error.toLowerCase().includes("forbidden") ||
      error.toLowerCase().includes("403") ||
      error.toLowerCase().includes("superadmin");
    return (
      <Card>
        <div className="c360-empty-state">
          <Activity size={32} className="c360-empty-state__icon" />
          <p className="c360-empty-state__title">
            {isForbidden
              ? "SuperAdmin Access Required"
              : "Could not load performance stats"}
          </p>
          <p className="c360-empty-state__desc">
            {isForbidden
              ? "Performance statistics are only available to SuperAdmin users."
              : error}
          </p>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const {
    cache,
    slowQueries,
    database,
    s3,
    endpointPerformance,
    tokenBlacklistCleanup,
  } = data;

  const hitPct = Math.min(100, Math.max(0, Math.round(cache.hitRate * 100)));

  return (
    <div className="c360-section-stack">
      <Card
        title="Cache Statistics"
        actions={<Zap size={16} className="c360-text-primary" />}
      >
        <div className="c360-card-body">
          {cache.enabled && (
            <div className="c360-mb-4">
              <Progress
                value={hitPct}
                max={100}
                showValue
                label="Cache hit rate"
                color="success"
                size="sm"
              />
            </div>
          )}
          <div className="c360-stat-grid">
            {[
              { label: "Enabled", value: cache.enabled ? "Yes" : "No" },
              { label: "Redis", value: cache.useRedis ? "Yes" : "No" },
              { label: "Hits", value: cache.hits.toLocaleString() },
              { label: "Misses", value: cache.misses.toLocaleString() },
              {
                label: "Hit Rate",
                value: `${(cache.hitRate * 100).toFixed(1)}%`,
              },
              {
                label: "Size / Max",
                value: `${cache.size} / ${cache.maxSize}`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="c360-stat-tile">
                <div className="c360-stat-tile__label">{label}</div>
                <div className="c360-stat-tile__value">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="c360-2col-grid">
        <Card
          title="Database"
          actions={<Database size={16} className="c360-text-primary" />}
        >
          <div className="c360-card-body">
            <div className="c360-section-stack c360-gap-2">
              {[
                { label: "Status", value: database.status },
                { label: "Pool Size", value: database.poolSize },
                { label: "Active", value: database.activeConnections },
                { label: "Idle", value: database.idleConnections },
              ].map(({ label, value }) => (
                <div key={label} className="c360-kv-row">
                  <span className="c360-kv-row__key">{label}</span>
                  <span className="c360-kv-row__value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card
          title="Slow Queries"
          actions={<Clock size={16} className="c360-text-warning" />}
        >
          <div className="c360-card-body">
            <div className="c360-section-stack c360-gap-2">
              {[
                { label: "Threshold", value: `${slowQueries.thresholdMs} ms` },
                { label: "Last Hour", value: slowQueries.countLastHour },
              ].map(({ label, value }) => (
                <div key={label} className="c360-kv-row">
                  <span className="c360-kv-row__key">{label}</span>
                  <span className="c360-kv-row__value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="S3 Storage"
        actions={<HardDrive size={16} className="c360-text-primary" />}
      >
        <div className="c360-card-body">
          <div className="c360-status-row c360-mb-3">
            <Badge
              color={
                s3.status === "healthy"
                  ? "green"
                  : s3.status === "not_configured"
                    ? "gray"
                    : "red"
              }
            >
              {s3.status}
            </Badge>
            <span className="c360-page-subtitle">{s3.message}</span>
          </div>
          {(s3.bucket ?? s3.region) && (
            <div className="c360-flex c360-gap-4 c360-text-sm">
              {s3.bucket && (
                <div>
                  <span className="c360-text-muted">Bucket: </span>
                  <strong>{s3.bucket}</strong>
                </div>
              )}
              {s3.region && (
                <div>
                  <span className="c360-text-muted">Region: </span>
                  <strong>{s3.region}</strong>
                </div>
              )}
            </div>
          )}
          {s3.error && (
            <Alert variant="danger" className="c360-mt-3">
              {s3.error}
            </Alert>
          )}
        </div>
      </Card>

      <Card
        title="Token blacklist cleanup"
        actions={<KeyRound size={16} className="c360-text-primary" />}
      >
        <div className="c360-card-body">
          <div className="c360-section-stack c360-gap-2">
            {[
              {
                label: "Last run",
                value: tokenBlacklistCleanup.lastRunStatus,
              },
              {
                label: "Interval",
                value: `${tokenBlacklistCleanup.cleanupIntervalSeconds}s`,
              },
              {
                label: "Last removed",
                value: tokenBlacklistCleanup.lastRemovedCount.toLocaleString(),
              },
              {
                label: "Last reason",
                value: tokenBlacklistCleanup.lastReason ?? "—",
              },
            ].map(({ label, value }) => (
              <div key={label} className="c360-kv-row">
                <span className="c360-kv-row__key">{label}</span>
                <span className="c360-kv-row__value">{value}</span>
              </div>
            ))}
          </div>
          {tokenBlacklistCleanup.lastError && (
            <Alert variant="danger" className="c360-mt-3">
              {tokenBlacklistCleanup.lastError}
            </Alert>
          )}
        </div>
      </Card>

      <Card title="Endpoint Performance">
        <div className="c360-card-body">
          <div className="c360-stat-grid c360-mb-4">
            {[
              {
                label: "Total Requests",
                value: endpointPerformance.totalRequests.toLocaleString(),
              },
              {
                label: "Avg Response",
                value: `${endpointPerformance.averageResponseTimeMs.toFixed(1)} ms`,
              },
              {
                label: "P95",
                value: `${endpointPerformance.p95ResponseTimeMs.toFixed(1)} ms`,
              },
              {
                label: "P99",
                value: `${endpointPerformance.p99ResponseTimeMs.toFixed(1)} ms`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="c360-stat-tile">
                <div className="c360-stat-tile__label">{label}</div>
                <div className="c360-stat-tile__value">{value}</div>
              </div>
            ))}
          </div>
          {endpointPerformance.slowEndpoints.length > 0 ? (
            <table className="c360-table">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th className="c360-text-right">Avg Time</th>
                  <th className="c360-text-right">Requests</th>
                </tr>
              </thead>
              <tbody>
                {endpointPerformance.slowEndpoints.map((ep) => (
                  <tr key={ep.endpoint}>
                    <td className="c360-mono">{ep.endpoint}</td>
                    <td className="c360-text-right">
                      {ep.averageTimeMs.toFixed(1)} ms
                    </td>
                    <td className="c360-text-right">
                      {ep.requestCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="c360-page-subtitle">
              No slow endpoints tracked yet (middleware integration pending).
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

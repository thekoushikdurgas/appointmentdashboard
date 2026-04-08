"use client";

import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/shared/Skeleton";
import type { VqlHealth, VqlStats } from "@/graphql/generated/types";

interface StatusConnectraTabProps {
  data: { vqlHealth: VqlHealth; vqlStats: VqlStats } | null;
  loading: boolean;
  error: string | null;
}

export function StatusConnectraTab({
  data,
  loading,
  error,
}: StatusConnectraTabProps) {
  if (loading) {
    return <Skeleton height={200} className="c360-status-ops-skeleton" />;
  }

  if (error) {
    return (
      <Card>
        <div className="c360-empty-state">
          <WifiOff size={32} className="c360-empty-state__icon" />
          <p className="c360-empty-state__title c360-text-danger">
            Could not load Connectra health: {error}
          </p>
          <p className="c360-empty-state__desc">
            Make sure you are authenticated and CONNECTRA_BASE_URL is
            configured.
          </p>
        </div>
      </Card>
    );
  }

  if (!data) return null;
  const { vqlHealth, vqlStats } = data;
  const isHealthy = vqlHealth.connectraStatus === "healthy";

  return (
    <div className="c360-section-stack">
      <Card title="Connectra / VQL Health">
        <div className="c360-card-body">
          <div className="c360-status-row c360-mb-4">
            <span
              className={cn(
                "c360-status-banner__icon",
                isHealthy ? "c360-text-success" : "c360-text-danger",
              )}
            >
              {vqlHealth.connectraEnabled ? (
                isHealthy ? (
                  <Wifi size={20} />
                ) : (
                  <WifiOff size={20} />
                )
              ) : (
                <WifiOff size={20} />
              )}
            </span>
            <div>
              <div className="c360-fw-medium c360-text-base">
                Connectra {vqlHealth.connectraEnabled ? "Enabled" : "Disabled"}
              </div>
              <div className="c360-page-subtitle">
                Status: <strong>{vqlHealth.connectraStatus}</strong>
              </div>
            </div>
            <Badge color={isHealthy ? "green" : "red"} className="c360-ml-auto">
              {vqlHealth.connectraStatus}
            </Badge>
          </div>

          <div className="c360-stat-grid c360-stat-grid--wide">
            <div className="c360-stat-tile">
              <div className="c360-stat-tile__label">Base URL</div>
              <div className="c360-stat-tile__value">
                {vqlHealth.connectraBaseUrl || "Not configured"}
              </div>
            </div>
            <div className="c360-stat-tile">
              <div className="c360-stat-tile__label">Monitoring</div>
              <div className="c360-stat-tile__value c360-stat-tile__value--medium">
                {vqlHealth.monitoringAvailable ? "Available" : "Unavailable"}
              </div>
            </div>
            {vqlHealth.connectraDetails && (
              <>
                <div className="c360-stat-tile">
                  <div className="c360-stat-tile__label">Version</div>
                  <div className="c360-stat-tile__value c360-stat-tile__value--medium">
                    {vqlHealth.connectraDetails.version ?? "—"}
                  </div>
                </div>
                <div className="c360-stat-tile">
                  <div className="c360-stat-tile__label">Uptime</div>
                  <div className="c360-stat-tile__value c360-stat-tile__value--medium">
                    {vqlHealth.connectraDetails.uptime != null
                      ? `${vqlHealth.connectraDetails.uptime}s`
                      : "—"}
                  </div>
                </div>
              </>
            )}
          </div>

          {vqlHealth.connectraError && (
            <Alert variant="danger" className="c360-mt-4">
              {vqlHealth.connectraError}
            </Alert>
          )}
        </div>
      </Card>

      <Card title="VQL Stats">
        <div className="c360-card-body">
          <p className="c360-page-subtitle c360-mb-1">{vqlStats.message}</p>
          <p className="c360-text-xs c360-text-muted">{vqlStats.note}</p>
        </div>
      </Card>
    </div>
  );
}

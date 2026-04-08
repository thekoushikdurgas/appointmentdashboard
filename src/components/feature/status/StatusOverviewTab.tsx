"use client";

import { ExternalLink, Package } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { type SystemHealth } from "@/services/graphql/healthService";
import { resolveGatewayDocsUrl } from "@/lib/gatewayDocs";
import { ServiceStatusRow, STATUS_CONFIG } from "./ServiceStatusRow";
import { cn } from "@/lib/utils";

const OVERALL_MESSAGES: Record<string, string> = {
  operational: "All systems are operating normally.",
  degraded: "Some services are experiencing degraded performance.",
  outage: "A critical service outage is currently in progress.",
  maintenance: "Scheduled maintenance is underway.",
};

interface StatusOverviewTabProps {
  health: SystemHealth;
}

export function StatusOverviewTab({ health }: StatusOverviewTabProps) {
  const cfg = STATUS_CONFIG[health.overallStatus];
  const bannerMod =
    health.overallStatus === "operational"
      ? "ok"
      : health.overallStatus === "degraded"
        ? "warn"
        : "err";

  const docsUrl = resolveGatewayDocsUrl(health.apiMetadata.docs);
  const env = health.apiHealth.environment;

  return (
    <>
      <Alert variant="info" className="c360-mb-4">
        Overview shows live data from the <strong>Contact360 API</strong> via
        GraphQL (<code className="c360-mono">apiHealth</code>,{" "}
        <code className="c360-mono">apiMetadata</code>). It reflects one gateway
        row, not an HTTP probe of every service in the ops matrix (see the
        Reference tab).
      </Alert>

      <div
        className={cn("c360-status-banner", `c360-status-banner--${bannerMod}`)}
      >
        <span
          className={cn(
            "c360-status-banner__icon",
            `c360-status-banner__icon--${bannerMod}`,
          )}
        >
          {cfg.icon}
        </span>
        <div>
          <div className="c360-status-banner__label">{cfg.label}</div>
          <div className="c360-status-banner__desc">
            {OVERALL_MESSAGES[health.overallStatus]}
          </div>
        </div>
        <div className="c360-status-banner__ts">
          Last checked: {new Date(health.lastUpdatedAt).toLocaleString()}
        </div>
      </div>

      <Card title="API" className="c360-mb-4">
        <div className="c360-card-body">
          <div className="c360-status-row c360-mb-3">
            <Package size={22} className="c360-text-muted" aria-hidden />
            <div className="c360-flex-1">
              <div className="c360-fw-medium c360-text-base">
                {health.apiMetadata.name}
              </div>
              <div className="c360-page-subtitle">
                Version <strong>{health.apiMetadata.version}</strong>
                <span className="c360-text-muted"> · </span>
                Environment <Badge color="blue">{env}</Badge>
              </div>
            </div>
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="c360-btn c360-btn--outline c360-btn--sm c360-flex c360-gap-2 c360-items-center"
            >
              <ExternalLink size={14} />
              API docs
            </a>
          </div>
          <p className="c360-text-sm c360-text-muted c360-m-0">
            Documentation path from gateway:{" "}
            <code className="c360-mono">{health.apiMetadata.docs}</code>
          </p>
        </div>
      </Card>

      <Card title="Gateway service (GraphQL)" className="c360-mb-4">
        <div className="c360-px-4 c360-pb-2">
          <div className="c360-status-col-header">
            <span className="c360-flex-1">Service</span>
            <span className="c360-status-row__cell--latency">Latency</span>
            <span className="c360-status-row__cell--uptime">Uptime</span>
            <span className="c360-status-col-header__status">Status</span>
          </div>
          {health.services.map((svc) => (
            <ServiceStatusRow key={svc.name} svc={svc} />
          ))}
        </div>
      </Card>

      <Card title="Incidents">
        <div className="c360-card-body">
          {health.incidents.length > 0 ? (
            health.incidents.map((inc) => (
              <div key={inc.id} className="c360-incident-card">
                <div className="c360-incident-card__title">{inc.title}</div>
                <div className="c360-incident-card__ts">
                  {new Date(inc.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <p className="c360-page-subtitle c360-m-0">
              No incidents reported. Overview reflects public gateway health
              only; Connectra and operations metrics are on the other tabs.
            </p>
          )}
        </div>
      </Card>
    </>
  );
}

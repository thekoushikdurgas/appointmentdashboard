"use client";

import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  type ServiceHealth,
  type ServiceStatus,
} from "@/services/graphql/healthService";
import { cn } from "@/lib/utils";

export const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  operational: {
    label: "Operational",
    color: "green",
    icon: <CheckCircle size={16} />,
  },
  degraded: {
    label: "Degraded",
    color: "yellow",
    icon: <AlertTriangle size={16} />,
  },
  outage: { label: "Outage", color: "red", icon: <XCircle size={16} /> },
  maintenance: {
    label: "Maintenance",
    color: "gray",
    icon: <Clock size={16} />,
  },
};

export function statusIconClass(status: ServiceStatus) {
  if (status === "operational") return "c360-status-banner__icon--ok";
  if (status === "degraded") return "c360-status-banner__icon--warn";
  return "c360-status-banner__icon--err";
}

interface ServiceStatusRowProps {
  svc: ServiceHealth;
}

export function ServiceStatusRow({ svc }: ServiceStatusRowProps) {
  const cfg = STATUS_CONFIG[svc.status];
  return (
    <div className="c360-status-row">
      <span
        className={cn("c360-status-banner__icon", statusIconClass(svc.status))}
      >
        {cfg.icon}
      </span>
      <div className="c360-status-row__body">
        <div className="c360-status-row__name">{svc.name}</div>
        {svc.message && (
          <div className="c360-status-row__msg">{svc.message}</div>
        )}
      </div>
      <div className="c360-status-row__cell c360-status-row__cell--latency">
        {svc.latencyMs !== null ? `${svc.latencyMs} ms` : "—"}
      </div>
      <div className="c360-status-row__cell c360-status-row__cell--uptime">
        {svc.uptimePercent.toFixed(2)}%
      </div>
      <Badge color={cfg.color as "green" | "yellow" | "red" | "gray"}>
        {cfg.label}
      </Badge>
    </div>
  );
}

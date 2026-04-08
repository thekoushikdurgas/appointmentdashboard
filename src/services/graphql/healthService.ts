import { graphqlQuery } from "@/lib/graphqlClient";
import {
  HEALTH_GATEWAY_PUBLIC,
  HEALTH_VQL,
  HEALTH_PERFORMANCE_STATS,
} from "@/graphql/healthOperations";
import type {
  ApiHealth,
  ApiMetadata,
  PerformanceStats,
  VqlHealth,
  VqlStats,
} from "@/graphql/generated/types";

export type { ApiHealth, ApiMetadata, PerformanceStats, VqlHealth, VqlStats };

export type ServiceStatus =
  | "operational"
  | "degraded"
  | "outage"
  | "maintenance";

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  latencyMs: number | null;
  uptimePercent: number;
  lastCheckedAt: string;
  message?: string;
}

export interface IncidentUpdate {
  id: string;
  time: string;
  message: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: "critical" | "major" | "minor";
  status: "investigating" | "identified" | "monitoring" | "resolved";
  createdAt: string;
  resolvedAt?: string;
  updates: IncidentUpdate[];
}

/** Dashboard overview model (public health + optional metadata for links). */
export interface SystemHealth {
  overallStatus: ServiceStatus;
  services: ServiceHealth[];
  incidents: Incident[];
  lastUpdatedAt: string;
  apiMetadata: ApiMetadata;
  apiHealth: ApiHealth;
}

export const healthService = {
  async getSystemHealth(): Promise<SystemHealth> {
    const data = await graphqlQuery<{
      health: { apiHealth: ApiHealth; apiMetadata: ApiMetadata };
    }>(HEALTH_GATEWAY_PUBLIC, {}, { skipAuth: true });

    const { apiHealth, apiMetadata } = data.health;
    const ok = (apiHealth.status || "").toLowerCase() === "healthy";
    const now = new Date().toISOString();
    return {
      overallStatus: ok ? "operational" : "degraded",
      lastUpdatedAt: now,
      apiMetadata,
      apiHealth,
      services: [
        {
          name: apiMetadata.name || "Contact360 API",
          status: ok ? "operational" : "degraded",
          latencyMs: null,
          uptimePercent: ok ? 99.9 : 95,
          lastCheckedAt: now,
          message: `Environment: ${apiHealth.environment} · v${apiMetadata.version}`,
        },
      ],
      incidents: [],
    };
  },

  /** Alias for clarity vs backend doc (“public” tier). */
  getPublicHealth: async (): Promise<SystemHealth> =>
    healthService.getSystemHealth(),

  async getVqlHealth(): Promise<{ vqlHealth: VqlHealth; vqlStats: VqlStats }> {
    const data = await graphqlQuery<{
      health: { vqlHealth: VqlHealth; vqlStats: VqlStats };
    }>(HEALTH_VQL, {});
    return {
      vqlHealth: data.health.vqlHealth,
      vqlStats: data.health.vqlStats,
    };
  },

  async getPerformanceStats(): Promise<PerformanceStats> {
    const data = await graphqlQuery<{
      health: { performanceStats: PerformanceStats };
    }>(HEALTH_PERFORMANCE_STATS, {});
    return data.health.performanceStats;
  },
};

/**
 * Health / status domain types. GraphQL shapes come from codegen; UI models from
 * `healthService` (see `docs/backend/graphql.modules/08_HEALTH_MODULE.md`).
 */

export type {
  ApiHealth,
  ApiMetadata,
  HealthQuery,
  PerformanceStats,
  VqlHealth,
  VqlStats,
  TokenBlacklistCleanupStats,
} from "@/graphql/generated/types";

export type {
  SystemHealth,
  ServiceHealth,
  ServiceStatus,
  Incident,
  IncidentUpdate,
} from "@/services/graphql/healthService";

/**
 * UI view-model types and app-specific type utilities.
 * Domain entity types (User, Contact, Company, etc.) now live in:
 *   - @/graphql/generated/types  (canonical * types)
 *   - @/types/api-modules        (legacy aliases of the above)
 * This file keeps only UI-specific shapes, feature gates, and misc utilities.
 */

// ─── Re-export canonical API types used widely across the app ─────────────────
export type {
  User as User,
  Contact as Contact,
  Company as Company,
  SchedulerJob as Job,
  ApiKey as ApiKey,
  Session as UserSession,
  Invoice as Invoice,
  SubscriptionPlan as Subscription,
} from "@/graphql/generated/types";

// ─── Dynamic page / CMS ───────────────────────────────────────────────────────

export interface DynamicPage {
  id: string;
  slug: string;
  title: string;
  description?: string;
  featureKey: string;
  isPublished: boolean;
  content: DynamicPageBlock[];
  meta: Record<string, unknown>;
}

export interface DynamicPageBlock {
  id: string;
  type: "text" | "chart" | "table" | "stat" | "embed";
  data: Record<string, unknown>;
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}

export interface GraphQLError {
  message: string;
  extensions?: {
    code?: string;
    field?: string;
  };
}

// ─── Feature access ───────────────────────────────────────────────────────────

export type FeatureKey =
  | "email_finder"
  | "email_verifier"
  | "bulk_finder"
  | "bulk_verifier"
  | "linkedin_export"
  | "ai_chat"
  | "live_voice"
  | "campaigns"
  | "api_access"
  | "team_seats"
  | "custom_integrations";

export interface FeatureGate {
  key: FeatureKey;
  label: string;
  plans: string[];
  requiresCredit: boolean;
  creditCost?: number;
}

// ─── UI utilities ─────────────────────────────────────────────────────────────

export type ThemeMode = "light" | "dark" | "system";

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface FilterState {
  [key: string]: string | string[] | undefined;
}

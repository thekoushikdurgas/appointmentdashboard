/**
 * Application Constants — routes, roles, era names, feature limits.
 */

export { ROUTES } from "./routes";

/* ─── User roles ──────────────────────────────────────────────────────────── */
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER",
  FREE: "FREE",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/* ─── Subscription plans ──────────────────────────────────────────────────── */
export const PLANS = {
  FREE: "free",
  STARTER: "starter",
  PROFESSIONAL: "professional",
  ENTERPRISE: "enterprise",
} as const;

export type SubscriptionPlan = (typeof PLANS)[keyof typeof PLANS];

/* ─── Era names ───────────────────────────────────────────────────────────── */
export const ERA_NAMES: Record<string, string> = {
  "0": "Foundation & Codebase Setup",
  "1": "User, Billing & Credit System",
  "2": "Email System",
  "3": "Contact & Company Data",
  "4": "Extension & Sales Navigator",
  "5": "AI Workflows",
  "6": "Reliability & Scaling",
  "7": "Deployment & Governance",
  "8": "Public & Private APIs",
  "9": "Ecosystem Integrations",
  "10": "Email Campaign",
};

/* ─── Default pagination ──────────────────────────────────────────────────── */
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/* ─── Job statuses ────────────────────────────────────────────────────────── */
export const JOB_STATUS = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  PAUSED: "PAUSED",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

/* ─── Email verify results ────────────────────────────────────────────────── */
export const EMAIL_RESULT = {
  VALID: "VALID",
  INVALID: "INVALID",
  CATCH_ALL: "CATCH_ALL",
  UNKNOWN: "UNKNOWN",
  RISKY: "RISKY",
} as const;

/* ─── Local storage keys ──────────────────────────────────────────────────── */
export const STORAGE_KEYS = {
  THEME: "c360-theme",
  SIDEBAR_COLLAPSED: "c360-sidebar-collapsed",
  LAST_ROUTE: "c360-last-route",
} as const;

/* ─── Sidebar navigation (tree; see navConfig) ───────────────────────────── */
export {
  SIDEBAR_SECTIONS,
  flattenNavLeaves,
  NAV_SEARCH_INDEX,
  isNavBranch,
  type NavNode,
  type NavLeaf,
  type NavBranch,
  type SidebarSectionConfig,
} from "./navConfig";

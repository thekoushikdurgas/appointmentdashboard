/** Application route paths — separate from constants to avoid cycles with navConfig. */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  ANALYTICS: "/analytics",
  CONTACTS: "/contacts",
  COMPANIES: "/companies",
  EMAIL: "/email",
  PHONE: "/phone",
  JOBS: "/jobs",
  FILES: "/files",
  LINKEDIN: "/linkedin",
  ACTIVITIES: "/activities",
  AI_CHAT: "/ai-chat",
  LIVE_VOICE: "/live-voice",
  BILLING: "/billing",
  USAGE: "/usage",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  STATUS: "/status",
  NOTIFICATIONS: "/notifications",
  SAVED_SEARCHES: "/saved-searches",
  CAMPAIGNS: "/campaigns",
  CAMPAIGNS_NEW: "/campaigns/new",
  CAMPAIGNS_TEMPLATES: "/campaigns/templates",
  CAMPAIGNS_SEQUENCES: "/campaigns/sequences",
  RESUME: "/resume",
  FORBIDDEN: "/403",
} as const;

/** Dynamic resume editor/detail path. */
export function resumeRoute(id: string): string {
  return `/resume/${encodeURIComponent(id)}`;
}

/** Single notification (deep link from list or email). */
export function notificationDetailRoute(id: string): string {
  return `/notifications/${encodeURIComponent(id)}`;
}

/** Single contact detail page. */
export function contactDetailRoute(uuid: string): string {
  return `/contacts/${encodeURIComponent(uuid)}`;
}

/** Sequence detail / step editor page. */
export function sequenceDetailRoute(id: string): string {
  return `/campaigns/sequences/${encodeURIComponent(id)}`;
}

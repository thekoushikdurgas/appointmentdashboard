/** Application route paths — separate from constants to avoid cycles with navConfig. */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  CONTACTS: "/contacts",
  COMPANIES: "/companies",
  EMAIL: "/email",
  PHONE: "/phone",
  HIRING_SIGNALS: "/hiring-signals",
  LINKEDIN: "/linkedin",
  ACTIVITIES: "/activities",
  AI_CHAT: "/ai-chat",
  LIVE_VOICE: "/live-voice",
  BILLING: "/billing",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  CAMPAIGNS: "/campaigns",
  CAMPAIGNS_NEW: "/campaigns/new",
  CAMPAIGNS_TEMPLATES: "/campaigns/templates",
  CAMPAIGNS_SEQUENCES: "/campaigns/sequences",
  RESUME: "/resume",
  FORBIDDEN: "/403",
} as const;

/** Deep link: Activities page with a given tab (and optional feature for Usage drill-down). */
export function activitiesTabRoute(
  tab: "feed" | "calendar" | "analytics" | "jobs" | "usage",
  feature?: string,
): string {
  const p = new URLSearchParams();
  p.set("tab", tab);
  if (feature?.trim()) p.set("feature", feature.trim());
  return `/activities?${p.toString()}`;
}

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

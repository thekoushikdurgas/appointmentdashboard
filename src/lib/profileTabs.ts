export const PROFILE_PATH = "/profile";

export const PROFILE_TABS = [
  "general",
  "security",
  "apikeys",
  "sessions",
  "team",
  "settings",
] as const;

export type ProfileTab = (typeof PROFILE_TABS)[number];

const PROFILE_TAB_SET = new Set<string>(PROFILE_TABS);

export function isProfileTab(value: string | null): value is ProfileTab {
  return value !== null && PROFILE_TAB_SET.has(value);
}

/** Deep link to a profile tab (`general` uses bare `/profile`). */
export function profileTabRoute(tab: ProfileTab = "general"): string {
  return tab === "general" ? PROFILE_PATH : `${PROFILE_PATH}?tab=${tab}`;
}

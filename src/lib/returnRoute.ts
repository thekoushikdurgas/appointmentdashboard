/**
 * Post-login route persistence: continuous last route + one-shot return route.
 */

import { ROUTES } from "./constants";
import { STORAGE_KEYS } from "./constants";

const AUTH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/lock-screen",
];

const FULL_SCREEN_PREFIXES = ["/403", "/404", "/400", "/500", "/503"];

/** Routes that must never be stored or used as post-login targets. */
export function validatePostLoginRoute(
  route: string | null | undefined,
): string | null {
  if (!route || typeof route !== "string") return null;
  const trimmed = route.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (AUTH_PREFIXES.some((p) => trimmed === p || trimmed.startsWith(`${p}?`))) {
    return null;
  }
  if (FULL_SCREEN_PREFIXES.some((p) => trimmed.startsWith(p))) return null;
  return trimmed;
}

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return validatePostLoginRoute(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function writeStorage(key: string, route: string): void {
  if (typeof window === "undefined") return;
  const valid = validatePostLoginRoute(route);
  if (!valid) return;
  try {
    localStorage.setItem(key, valid);
  } catch {
    /* ignore quota errors */
  }
}

export function saveLastRoute(route: string): void {
  writeStorage(STORAGE_KEYS.LAST_ROUTE, route);
}

export function readLastRoute(): string | null {
  return readStorage(STORAGE_KEYS.LAST_ROUTE);
}

export function saveReturnRoute(route?: string): void {
  const target =
    route ??
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "");
  writeStorage(STORAGE_KEYS.RETURN_ROUTE, target);
}

export function readReturnRoute(): string | null {
  return readStorage(STORAGE_KEYS.RETURN_ROUTE);
}

/**
 * Resolve where to navigate after successful auth.
 * Priority: `?next=` query param > one-shot return route > last route > dashboard.
 */
export function consumePostLoginRoute(nextParam?: string | null): string {
  const fromQuery = validatePostLoginRoute(nextParam ?? undefined);
  if (fromQuery) return fromQuery;

  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const next = validatePostLoginRoute(params.get("next"));
    if (next) return next;
  }

  const returnRoute = readReturnRoute();
  if (returnRoute) {
    try {
      localStorage.removeItem(STORAGE_KEYS.RETURN_ROUTE);
    } catch {
      /* ignore */
    }
    return returnRoute;
  }

  return readLastRoute() ?? ROUTES.DASHBOARD;
}

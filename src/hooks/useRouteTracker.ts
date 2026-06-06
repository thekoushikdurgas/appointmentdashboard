"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  readLastRoute,
  saveLastRoute,
  validatePostLoginRoute,
} from "@/lib/returnRoute";

/** @deprecated Use validatePostLoginRoute — same behavior, plan alias. */
export const isStorableRoute = validatePostLoginRoute;

/** Continuously track the last visited in-app route (authenticated users only). */
export function useRouteTracker(enabled = true): void {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !user) return;
    const query = searchParams.toString();
    const full = query ? `${pathname}?${query}` : pathname;
    const valid = validatePostLoginRoute(full);
    if (!valid || valid === readLastRoute()) return;
    saveLastRoute(valid);
  }, [enabled, user, pathname, searchParams]);
}

export function RouteTracker(): null {
  useRouteTracker(true);
  return null;
}

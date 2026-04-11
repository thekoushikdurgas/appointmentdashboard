"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribe to a CSS media query (SSR-safe).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    () =>
      typeof window !== "undefined" ? window.matchMedia(query).matches : false,
    () => false,
  );
}

/** Matches appointment-d1 desktop breakpoint for resizable / inline filters. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

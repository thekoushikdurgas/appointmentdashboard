"use client";

import { useEffect, useRef } from "react";
import { analyticsService } from "@/services/graphql/analyticsService";

/**
 * Fire-and-forget performance metric on mount.
 * Silently swallows errors — never blocks the page.
 */
export function usePerformanceMetric(
  name: string,
  value?: number,
  metadata?: Record<string, unknown>,
) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const start = performance.now();
    // If no explicit value, measure time-to-interactive from page load
    const metricValue =
      value ??
      (typeof window !== "undefined" &&
      typeof window.performance !== "undefined"
        ? performance.now() - start + (performance.timeOrigin ?? 0) / 1000
        : 0);
    void analyticsService
      .submitPerformanceMetric({
        name,
        value: metricValue,
        timestamp: String(Date.now()),
        metadata: {
          url:
            typeof window !== "undefined"
              ? window.location.pathname
              : undefined,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          ...metadata,
        },
      })
      .catch(() => {
        /* silent — never block UI */
      });
  }, [name, value, metadata]);
}

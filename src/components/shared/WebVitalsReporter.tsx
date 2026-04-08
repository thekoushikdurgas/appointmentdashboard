"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import type { Metric } from "web-vitals";
import { useAuth } from "@/context/AuthContext";
import { analyticsService } from "@/services/graphql/analyticsService";

/** Map browser-reported units to API storage (LCP stored as seconds). */
function metricValueForApi(name: string, value: number): number {
  if (name === "LCP") return value / 1000;
  return value;
}

/**
 * Sends Core Web Vitals to `analytics.submitPerformanceMetric` when the user
 * is authenticated. Fire-and-forget; failures are ignored on the client.
 */
export function WebVitalsReporter() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const send = (metric: Metric) => {
      const path =
        typeof window !== "undefined" ? window.location.pathname : "";
      void analyticsService
        .submitPerformanceMetric(
          {
            name: metric.name,
            value: metricValueForApi(metric.name, metric.value),
            timestamp: String(Date.now()),
            metadata: {
              path,
              rating: metric.rating,
              navigationType: metric.navigationType,
            },
          },
          { showToastOnError: false },
        )
        .catch(() => {});
    };

    onCLS(send);
    onINP(send);
    onLCP(send);
    onFCP(send);
    onTTFB(send);
  }, [user]);

  return null;
}

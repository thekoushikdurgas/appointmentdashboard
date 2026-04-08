"use client";

import { useState, useEffect, useCallback } from "react";
import { healthService } from "@/services/graphql/healthService";
import type { PerformanceStats } from "@/graphql/generated/types";

export interface UsePerformanceStatsDataOptions {
  /** SuperAdmin-only query — set false to skip network entirely. */
  enabled: boolean;
}

/** `health.performanceStats` — typically SuperAdmin-only. */
export function usePerformanceStatsData({
  enabled,
}: UsePerformanceStatsDataOptions) {
  const [data, setData] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await healthService.getPerformanceStats());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Performance stats unavailable",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  return { data, loading, error, refresh };
}

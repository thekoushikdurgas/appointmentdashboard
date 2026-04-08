"use client";

import { useState, useEffect, useCallback } from "react";
import { healthService } from "@/services/graphql/healthService";
import type { VqlHealth, VqlStats } from "@/graphql/generated/types";

export interface UseVqlHealthDataOptions {
  /** When true, fetch Connectra / VQL health (requires auth). */
  enabled: boolean;
}

/** Authenticated `vqlHealth` + `vqlStats` (lazy when `enabled`). */
export function useVqlHealthData({ enabled }: UseVqlHealthDataOptions) {
  const [data, setData] = useState<{
    vqlHealth: VqlHealth;
    vqlStats: VqlStats;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await healthService.getVqlHealth());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Connectra health check failed",
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

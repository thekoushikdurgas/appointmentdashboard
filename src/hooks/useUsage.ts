"use client";

import { useState, useEffect, useCallback } from "react";
import {
  usageService,
  type FeatureUsage,
} from "@/services/graphql/usageService";
import type {
  TrackUsageInput,
  ResetUsageInput,
} from "@/graphql/generated/types";

export interface UseUsageOptions {
  /** Fetch a single feature row (gateway filter). */
  feature?: string;
  /** Fetch several features in parallel (one query each). */
  features?: string[];
}

export function useUsage(opts?: UseUsageOptions) {
  const [usageData, setUsageData] = useState<FeatureUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const depKey = [opts?.feature ?? "", opts?.features?.join(",") ?? ""].join(
    "|",
  );

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // `depKey` encodes opts?.feature and opts?.features — see hook deps.
      if (opts?.feature) {
        const res = await usageService.getUsage(opts.feature);
        setUsageData(res.usage.usage.features);
        return;
      }
      if (opts?.features && opts.features.length > 0) {
        const results = await Promise.allSettled(
          opts.features.map((f) => usageService.getUsage(f)),
        );
        const all: FeatureUsage[] = [];
        results.forEach((r) => {
          if (r.status === "fulfilled") {
            all.push(...r.value.usage.usage.features);
          }
        });
        setUsageData(all);
        return;
      }
      const res = await usageService.getUsage();
      setUsageData(res.usage.usage.features);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depKey serializes opts
  }, [depKey]);

  useEffect(() => {
    void fetchUsage();
  }, [fetchUsage]);

  const getFeature = useCallback(
    (featureName: string) =>
      usageData.find(
        (f) => f.feature.toUpperCase() === featureName.toUpperCase(),
      ) ?? null,
    [usageData],
  );

  const trackUsage = useCallback(
    async (input: TrackUsageInput) => {
      const res = await usageService.trackUsage(input);
      await fetchUsage();
      return res.usage.trackUsage;
    },
    [fetchUsage],
  );

  const resetUsage = useCallback(
    async (input: ResetUsageInput) => {
      const res = await usageService.resetUsage(input);
      await fetchUsage();
      return res.usage.resetUsage;
    },
    [fetchUsage],
  );

  return {
    usageData,
    loading,
    error,
    getFeature,
    refresh: fetchUsage,
    trackUsage,
    resetUsage,
  };
}

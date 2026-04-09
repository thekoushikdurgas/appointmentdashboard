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
import {
  readTTLCache,
  writeTTLCache,
  clearTTLCache,
} from "@/lib/ttlLocalStorageCache";

const USAGE_CACHE_PREFIX = "c360:usage:v1:";
const USAGE_TTL_MS = 2 * 60 * 1000;

export interface UseUsageOptions {
  /** Fetch a single feature row (gateway filter). */
  feature?: string;
  /** Fetch several features in parallel (one query each). */
  features?: string[];
}

export function useUsage(opts?: UseUsageOptions) {
  const depKey = [opts?.feature ?? "", opts?.features?.join(",") ?? ""].join(
    "|",
  );

  const cacheKey = `${USAGE_CACHE_PREFIX}${depKey}`;

  const [usageData, setUsageData] = useState<FeatureUsage[]>(
    () => readTTLCache<FeatureUsage[]>(cacheKey) ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(
    async (invalidateCache = false) => {
      if (invalidateCache) clearTTLCache(cacheKey);

      if (!invalidateCache) {
        const cached = readTTLCache<FeatureUsage[]>(cacheKey);
        if (cached) {
          setUsageData(cached);
          return;
        }
      }

      setLoading(true);
      setError(null);
      try {
        let features: FeatureUsage[] = [];

        if (opts?.feature) {
          const res = await usageService.getUsage(opts.feature);
          features = res.usage.usage.features;
        } else if (opts?.features && opts.features.length > 0) {
          const results = await Promise.allSettled(
            opts.features.map((f) => usageService.getUsage(f)),
          );
          results.forEach((r) => {
            if (r.status === "fulfilled") {
              features.push(...r.value.usage.usage.features);
            }
          });
        } else {
          const res = await usageService.getUsage();
          features = res.usage.usage.features;
        }

        setUsageData(features);
        writeTTLCache(cacheKey, features, USAGE_TTL_MS);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depKey serializes opts
    [depKey, cacheKey],
  );

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
      await fetchUsage(true);
      return res.usage.trackUsage;
    },
    [fetchUsage],
  );

  const resetUsage = useCallback(
    async (input: ResetUsageInput) => {
      const res = await usageService.resetUsage(input);
      await fetchUsage(true);
      return res.usage.resetUsage;
    },
    [fetchUsage],
  );

  return {
    usageData,
    loading,
    error,
    getFeature,
    refresh: () => fetchUsage(true),
    trackUsage,
    resetUsage,
  };
}

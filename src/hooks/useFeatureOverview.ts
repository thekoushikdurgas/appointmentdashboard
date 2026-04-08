"use client";

import { useState, useEffect, useCallback } from "react";
import { usageService } from "@/services/graphql/usageService";
import type { FeatureOverview } from "@/graphql/generated/types";

export function useFeatureOverview(feature: string | null) {
  const [overview, setOverview] = useState<FeatureOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!feature?.trim()) {
      setOverview(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await usageService.getFeatureOverview(feature.trim());
      setOverview(data.featureOverview.featureOverview);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [feature]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { overview, loading, error, refresh };
}

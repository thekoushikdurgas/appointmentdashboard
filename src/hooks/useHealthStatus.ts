"use client";

import { useState, useCallback } from "react";
import { usePublicHealth } from "@/hooks/usePublicHealth";
import { useVqlHealthData } from "@/hooks/useVqlHealthData";
import { usePerformanceStatsData } from "@/hooks/usePerformanceStatsData";

export type HealthStatusTab =
  | "overview"
  | "connectra"
  | "operations"
  | "reference";

export interface UseHealthStatusOptions {
  /** When false, `performanceStats` is never requested (non–SuperAdmin). */
  operationsEnabled?: boolean;
}

/**
 * Consolidates dashboard tabs: public overview, Connectra/VQL, SuperAdmin ops,
 * and static envelope reference. Uses `usePublicHealth`, `useVqlHealthData`,
 * `usePerformanceStatsData` under the hood.
 */
export function useHealthStatus(options?: UseHealthStatusOptions) {
  const operationsEnabled = options?.operationsEnabled ?? true;
  const [tab, setTab] = useState<HealthStatusTab>("overview");

  const overview = usePublicHealth();
  const vql = useVqlHealthData({ enabled: tab === "connectra" });
  const perf = usePerformanceStatsData({
    enabled: tab === "operations" && operationsEnabled,
  });

  const refreshOverview = overview.refresh;
  const refreshVql = vql.refresh;
  const refreshPerf = perf.refresh;

  const refreshCurrent = useCallback(() => {
    if (tab === "overview") void refreshOverview();
    else if (tab === "connectra") void refreshVql();
    else if (tab === "operations" && operationsEnabled) void refreshPerf();
  }, [tab, operationsEnabled, refreshOverview, refreshVql, refreshPerf]);

  const refreshing =
    (tab === "overview" && overview.loading) ||
    (tab === "connectra" && vql.loading) ||
    (tab === "operations" && operationsEnabled && perf.loading);

  return {
    tab,
    setTab,
    overview: {
      data: overview.data,
      loading: overview.loading,
      error: overview.error,
      refresh: overview.refresh,
    },
    connectra: {
      data: vql.data,
      loading: vql.loading,
      error: vql.error,
      refresh: vql.refresh,
    },
    operations: {
      data: perf.data,
      loading: perf.loading,
      error: perf.error,
      refresh: perf.refresh,
    },
    refreshCurrent,
    refreshing,
  };
}

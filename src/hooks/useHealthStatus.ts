"use client";

import { useState, useCallback } from "react";
import { usePublicHealth } from "@/hooks/usePublicHealth";
import { useVqlHealthData } from "@/hooks/useVqlHealthData";

export type HealthStatusTab = "overview" | "connectra" | "reference";

/**
 * Consolidates dashboard tabs: public overview, Connectra/VQL, and static
 * envelope reference. SuperAdmin-only operations live in Django admin.
 */
export function useHealthStatus() {
  const [tab, setTab] = useState<HealthStatusTab>("overview");

  const overview = usePublicHealth();
  const vql = useVqlHealthData({ enabled: tab === "connectra" });

  const refreshOverview = overview.refresh;
  const refreshVql = vql.refresh;

  const refreshCurrent = useCallback(() => {
    if (tab === "overview") void refreshOverview();
    else if (tab === "connectra") void refreshVql();
  }, [tab, refreshOverview, refreshVql]);

  const refreshing =
    (tab === "overview" && overview.loading) ||
    (tab === "connectra" && vql.loading);

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
    refreshCurrent,
    refreshing,
  };
}

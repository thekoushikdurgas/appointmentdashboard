"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  analyticsService,
  type MetricAggregationRow,
  type PerformanceMetricRow,
} from "@/services/graphql/analyticsService";
import type { AnalyticsPeriod } from "@/lib/analyticsPeriod";
import { getMetricsDateRange } from "@/lib/analyticsPeriod";

export interface UseAnalyticsOptions {
  period: AnalyticsPeriod;
  /** Core Web Vitals name (e.g. LCP); required for aggregation. */
  metricName: string;
  /** Max rows for the time series / table */
  limit?: number;
}

export function useAnalytics({
  period,
  metricName,
  limit = 500,
}: UseAnalyticsOptions) {
  const [rows, setRows] = useState<PerformanceMetricRow[]>([]);
  const [aggregation, setAggregation] = useState<MetricAggregationRow | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } = getMetricsDateRange(period);
    const input = {
      metricName,
      startDate,
      endDate,
      limit,
    };
    try {
      const [list, agg] = await Promise.all([
        analyticsService.listPerformanceMetrics(input),
        analyticsService.aggregateMetrics({
          metricName,
          startDate,
          endDate,
        }),
      ]);
      setRows(list);
      setAggregation(agg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
      setRows([]);
      setAggregation(null);
    } finally {
      setLoading(false);
    }
  }, [period, metricName, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const dateRange = useMemo(() => getMetricsDateRange(period), [period]);

  return {
    rows,
    aggregation,
    loading,
    error,
    refresh: load,
    dateRange,
  };
}

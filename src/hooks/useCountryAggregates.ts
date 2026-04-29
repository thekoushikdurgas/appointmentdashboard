"use client";

import { useState, useEffect, useCallback } from "react";
import {
  contactsService,
  type ContactGeoAnalyticsResult,
} from "@/services/graphql/contactsService";
import type { CountryCount } from "@/components/shared/WorldMap";
import { toNumericIso } from "@/lib/isoCountryCodes";
import type { VqlQueryInput } from "@/graphql/generated/types";

export interface UseCountryAggregatesReturn {
  data: CountryCount[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /** Raw analytics (totals, unmapped) for UI copy; null until first success. */
  analytics: Pick<
    ContactGeoAnalyticsResult,
    "total" | "unmappedCount" | "sumOtherDocCount"
  > | null;
}

function mapGeoToCountryCounts(res: ContactGeoAnalyticsResult): CountryCount[] {
  const mapped: CountryCount[] = [];
  for (const item of res.countries ?? []) {
    const numericId = toNumericIso(item.value ?? "");
    if (!numericId) continue;
    mapped.push({
      id: numericId,
      name: item.displayValue ?? item.value ?? numericId,
      count: item.count ?? 1,
    });
  }
  return mapped;
}

/**
 * Fetches VQL-scoped country-level contact counts via ``contacts.geoAnalytics``.
 * Pass the same VQL you use for the contact list (e.g. export VQL) so the map
 * matches the filtered cohort.
 */
export function useCountryAggregates(
  vqlQuery: Partial<VqlQueryInput> | null | undefined,
): UseCountryAggregatesReturn {
  const [data, setData] = useState<CountryCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] =
    useState<UseCountryAggregatesReturn["analytics"]>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contactsService.geoAnalytics({
        query: vqlQuery ?? undefined,
        includeCities: false,
      });
      setAnalytics({
        total: res.total,
        unmappedCount: res.unmappedCount,
        sumOtherDocCount: res.sumOtherDocCount,
      });
      setData(mapGeoToCountryCounts(res));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load country data.");
      setData([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [vqlQuery]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch, analytics };
}

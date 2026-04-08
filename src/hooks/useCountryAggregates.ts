"use client";

import { useState, useEffect, useCallback } from "react";
import { contactsService } from "@/services/graphql/contactsService";
import type { CountryCount } from "@/components/shared/WorldMap";
import { toNumericIso } from "@/lib/isoCountryCodes";

const COUNTRY_FILTER_KEY = "country";

export interface UseCountryAggregatesReturn {
  data: CountryCount[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches country-level contact counts via the contacts.filterData API.
 * Returns data shaped for the WorldMap component (ISO 3166-1 numeric ids).
 *
 * Falls back to an empty array if the country filter key is unavailable.
 */
export function useCountryAggregates(): UseCountryAggregatesReturn {
  const [data, setData] = useState<CountryCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contactsService.filterData({
        filterKey: COUNTRY_FILTER_KEY,
      });
      const items = res?.contacts?.filterData?.items ?? [];
      const mapped: CountryCount[] = [];
      for (const item of items) {
        const numericId = toNumericIso(item.value ?? "");
        if (!numericId) continue;
        mapped.push({
          id: numericId,
          name: item.displayValue ?? item.value ?? numericId,
          count: item.count ?? 1,
        });
      }
      setData(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load country data.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}

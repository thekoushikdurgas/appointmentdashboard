"use client";

import { useState, useEffect, useCallback } from "react";
import { companiesService } from "@/services/graphql/companiesService";
import type {
  CompanyFilter,
  CompanyFilterData,
} from "@/graphql/generated/types";
import { readTTLCache, writeTTLCache } from "@/lib/ttlLocalStorageCache";

const COMPANY_FILTERS_CACHE_KEY = "c360:company:filters:v1";
const COMPANY_FILTERS_TTL_MS = 30 * 60 * 1000;

export interface CompanyFilterSection {
  filterKey: string;
  displayName: string;
  filterType: string;
  options: CompanyFilterData[];
  loading: boolean;
}

export interface UseCompanyFiltersReturn {
  filters: CompanyFilter[];
  filtersLoading: boolean;
  sections: CompanyFilterSection[];
  loadFilterData: (filterKey: string) => Promise<void>;
}

export function useCompanyFilters(): UseCompanyFiltersReturn {
  const [filters, setFilters] = useState<CompanyFilter[]>(
    () => readTTLCache<CompanyFilter[]>(COMPANY_FILTERS_CACHE_KEY) ?? [],
  );
  const [filtersLoading, setFiltersLoading] = useState(
    () => readTTLCache<CompanyFilter[]>(COMPANY_FILTERS_CACHE_KEY) == null,
  );
  const [sectionData, setSectionData] = useState<
    Record<string, { options: CompanyFilterData[]; loading: boolean }>
  >({});

  useEffect(() => {
    const cached = readTTLCache<CompanyFilter[]>(COMPANY_FILTERS_CACHE_KEY);
    if (cached) {
      setFilters(cached);
      setFiltersLoading(false);
      return;
    }
    let cancelled = false;
    setFiltersLoading(true);
    companiesService
      .getFilters()
      .then((res) => {
        if (!cancelled) {
          const items = res.companies.filters.items;
          setFilters(items);
          writeTTLCache(
            COMPANY_FILTERS_CACHE_KEY,
            items,
            COMPANY_FILTERS_TTL_MS,
          );
        }
      })
      .catch(() => {
        if (!cancelled) setFilters([]);
      })
      .finally(() => {
        if (!cancelled) setFiltersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadFilterData = useCallback(async (filterKey: string) => {
    setSectionData((prev) => ({
      ...prev,
      [filterKey]: { options: prev[filterKey]?.options ?? [], loading: true },
    }));
    try {
      const res = await companiesService.filterData({ filterKey });
      setSectionData((prev) => ({
        ...prev,
        [filterKey]: {
          options: res.items,
          loading: false,
        },
      }));
    } catch {
      setSectionData((prev) => ({
        ...prev,
        [filterKey]: { options: [], loading: false },
      }));
    }
  }, []);

  const sections: CompanyFilterSection[] = filters.map((f) => ({
    filterKey: f.filterKey,
    displayName: f.displayName,
    filterType: f.filterType,
    options: sectionData[f.filterKey]?.options ?? [],
    loading: sectionData[f.filterKey]?.loading ?? false,
  }));

  return { filters, filtersLoading, sections, loadFilterData };
}

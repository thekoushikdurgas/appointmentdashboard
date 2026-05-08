"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { companiesService } from "@/services/graphql/companiesService";
import type {
  CompanyFilter,
  CompanyFilterData,
} from "@/graphql/generated/types";
import {
  clearTTLCache,
  readTTLCache,
  writeTTLCache,
} from "@/lib/ttlLocalStorageCache";
import {
  useCompanyFilterOptions,
  type CompanyFilterOptionsState,
} from "@/hooks/useCompanyFilterOptions";

export const COMPANY_FILTERS_CACHE_KEY = "c360:company:filters:v1";
const COMPANY_FILTERS_TTL_MS = 30 * 60 * 1000;

function companyFilterHasMore(st: CompanyFilterOptionsState): boolean {
  if (st.loading || st.loadingMore) return false;
  return st.canLoadMore;
}

export interface CompanyFilterSection {
  filterKey: string;
  displayName: string;
  filterType: string;
  options: CompanyFilterData[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  searchText: string;
}

export interface UseCompanyFiltersReturn {
  filters: CompanyFilter[];
  filtersLoading: boolean;
  sections: CompanyFilterSection[];
  loadFilterData: (filterKey: string) => Promise<void>;
  loadMoreFilterData: (filterKey: string) => Promise<void>;
  setFilterSearch: (filterKey: string, text: string) => void;
  refetchFiltersMetadata: () => Promise<void>;
}

export function useCompanyFilters(): UseCompanyFiltersReturn {
  const [filters, setFilters] = useState<CompanyFilter[]>(
    () => readTTLCache<CompanyFilter[]>(COMPANY_FILTERS_CACHE_KEY) ?? [],
  );
  const [filtersLoading, setFiltersLoading] = useState(
    () => readTTLCache<CompanyFilter[]>(COMPANY_FILTERS_CACHE_KEY) == null,
  );

  const {
    getState,
    openFilter,
    loadMore,
    setSearch,
    resetAll: resetFilterOptions,
  } = useCompanyFilterOptions();

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

  const loadFilterData = useCallback(
    async (filterKey: string) => {
      await openFilter(filterKey);
    },
    [openFilter],
  );

  const loadMoreFilterData = useCallback(
    async (filterKey: string) => {
      await loadMore(filterKey);
    },
    [loadMore],
  );

  const setFilterSearch = useCallback(
    (filterKey: string, text: string) => {
      setSearch(filterKey, text);
    },
    [setSearch],
  );

  const sections: CompanyFilterSection[] = useMemo(
    () =>
      filters.map((f) => {
        const st = getState(f.filterKey);
        return {
          filterKey: f.filterKey,
          displayName: f.displayName,
          filterType: f.filterType,
          options: st.items,
          loading: st.loading,
          loadingMore: st.loadingMore,
          hasMore: companyFilterHasMore(st),
          searchText: st.searchText,
        };
      }),
    [filters, getState],
  );

  const refetchFiltersMetadata = useCallback(async () => {
    clearTTLCache(COMPANY_FILTERS_CACHE_KEY);
    resetFilterOptions();
    setFiltersLoading(true);
    try {
      const res = await companiesService.getFilters();
      const items = res.companies.filters.items;
      setFilters(items);
      writeTTLCache(COMPANY_FILTERS_CACHE_KEY, items, COMPANY_FILTERS_TTL_MS);
    } catch {
      setFilters([]);
    } finally {
      setFiltersLoading(false);
    }
  }, [resetFilterOptions]);

  return {
    filters,
    filtersLoading,
    sections,
    loadFilterData,
    loadMoreFilterData,
    setFilterSearch,
    refetchFiltersMetadata,
  };
}

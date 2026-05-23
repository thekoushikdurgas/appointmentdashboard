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

/** Non-empty cache only — empty arrays must not block refetch (failed/empty API responses). */
function readValidCompanyFiltersCache(): CompanyFilter[] | null {
  const cached = readTTLCache<CompanyFilter[]>(COMPANY_FILTERS_CACHE_KEY);
  if (!cached || !Array.isArray(cached) || cached.length === 0) return null;
  return cached;
}

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
  /** Set when `getFilters` fails (e.g. Connectra / company index unavailable). */
  filtersError: string | null;
  sections: CompanyFilterSection[];
  loadFilterData: (filterKey: string) => Promise<void>;
  loadMoreFilterData: (filterKey: string) => Promise<void>;
  setFilterSearch: (filterKey: string, text: string) => void;
  refetchFiltersMetadata: () => Promise<void>;
}

export function useCompanyFilters(): UseCompanyFiltersReturn {
  const [filters, setFilters] = useState<CompanyFilter[]>(
    () => readValidCompanyFiltersCache() ?? [],
  );
  const [filtersLoading, setFiltersLoading] = useState(
    () => readValidCompanyFiltersCache() == null,
  );
  const [filtersError, setFiltersError] = useState<string | null>(null);

  const {
    getState,
    openFilter,
    loadMore,
    setSearch,
    resetAll: resetFilterOptions,
  } = useCompanyFilterOptions();

  useEffect(() => {
    const cached = readValidCompanyFiltersCache();
    if (cached) {
      setFilters(cached);
      setFiltersLoading(false);
      setFiltersError(null);
      return;
    }
    let cancelled = false;
    setFiltersLoading(true);
    setFiltersError(null);
    companiesService
      .getFilters()
      .then((res) => {
        if (!cancelled) {
          const items = res.companies.filters.items;
          setFilters(items);
          setFiltersError(null);
          if (items.length > 0) {
            writeTTLCache(
              COMPANY_FILTERS_CACHE_KEY,
              items,
              COMPANY_FILTERS_TTL_MS,
            );
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFilters([]);
          setFiltersError(
            err instanceof Error ? err.message : "Failed to load filter definitions",
          );
        }
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
      setFiltersError(null);
      if (items.length > 0) {
        writeTTLCache(COMPANY_FILTERS_CACHE_KEY, items, COMPANY_FILTERS_TTL_MS);
      }
    } catch (err: unknown) {
      setFilters([]);
      setFiltersError(
        err instanceof Error ? err.message : "Failed to load filter definitions",
      );
    } finally {
      setFiltersLoading(false);
    }
  }, [resetFilterOptions]);

  return {
    filters,
    filtersLoading,
    filtersError,
    sections,
    loadFilterData,
    loadMoreFilterData,
    setFilterSearch,
    refetchFiltersMetadata,
  };
}

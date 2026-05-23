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

// #region agent log
function agentLogCompanyFilters(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
): void {
  fetch("http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "d296a1",
    },
    body: JSON.stringify({
      sessionId: "d296a1",
      location,
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
    }),
  }).catch(() => {});
}
// #endregion

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
    () => readValidCompanyFiltersCache() ?? [],
  );
  const [filtersLoading, setFiltersLoading] = useState(
    () => readValidCompanyFiltersCache() == null,
  );

  const {
    getState,
    openFilter,
    loadMore,
    setSearch,
    resetAll: resetFilterOptions,
  } = useCompanyFilterOptions();

  useEffect(() => {
    const rawCached = readTTLCache<CompanyFilter[]>(COMPANY_FILTERS_CACHE_KEY);
    const cached = readValidCompanyFiltersCache();
    // #region agent log
    agentLogCompanyFilters(
      "useCompanyFilters.ts:useEffect",
      "company filters mount",
      {
        rawCachedIsArray: Array.isArray(rawCached),
        rawCachedLength: Array.isArray(rawCached) ? rawCached.length : null,
        validCacheHit: cached != null,
        validCacheLength: cached?.length ?? 0,
      },
      "B",
    );
    // #endregion
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
          // #region agent log
          agentLogCompanyFilters(
            "useCompanyFilters.ts:getFilters.then",
            "company filters API success",
            {
              itemCount: items.length,
              filterKeys: items.slice(0, 12).map((f) => f.filterKey),
            },
            "A",
          );
          // #endregion
          setFilters(items);
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
        // #region agent log
        agentLogCompanyFilters(
          "useCompanyFilters.ts:getFilters.catch",
          "company filters API failed",
          {
            error:
              err instanceof Error
                ? err.message
                : String(err ?? "unknown"),
          },
          "A",
        );
        // #endregion
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

  const sections: CompanyFilterSection[] = useMemo(() => {
    const mapped = filters.map((f) => {
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
    });
    // #region agent log
    agentLogCompanyFilters(
      "useCompanyFilters.ts:sections",
      "company filter sections built",
      {
        filtersCount: filters.length,
        sectionsCount: mapped.length,
        filtersLoading,
      },
      "D",
    );
    // #endregion
    return mapped;
  }, [filters, getState, filtersLoading]);

  const refetchFiltersMetadata = useCallback(async () => {
    clearTTLCache(COMPANY_FILTERS_CACHE_KEY);
    resetFilterOptions();
    setFiltersLoading(true);
    try {
      const res = await companiesService.getFilters();
      const items = res.companies.filters.items;
      setFilters(items);
      if (items.length > 0) {
        writeTTLCache(COMPANY_FILTERS_CACHE_KEY, items, COMPANY_FILTERS_TTL_MS);
      }
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

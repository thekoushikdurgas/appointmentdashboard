"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { contactsService } from "@/services/graphql/contactsService";
import type {
  ContactFilter,
  ContactFilterData,
} from "@/graphql/generated/types";
import {
  clearTTLCache,
  readTTLCache,
  writeTTLCache,
} from "@/lib/ttlLocalStorageCache";
import {
  useFilterOptions,
  computeFilterHasMore,
} from "@/hooks/useFilterOptions";

export const CONTACT_FILTERS_CACHE_KEY = "c360:contact:filters:v3";
const CONTACT_FILTERS_TTL_MS = 30 * 60 * 1000;

/** Non-empty cache only — empty arrays must not block refetch (failed/empty API responses). */
function readValidContactFiltersCache(): ContactFilter[] | null {
  const cached = readTTLCache<ContactFilter[]>(CONTACT_FILTERS_CACHE_KEY);
  if (!cached || !Array.isArray(cached) || cached.length === 0) return null;
  return cached;
}

export interface FilterSection {
  filterKey: string;
  displayName: string;
  filterType: string;
  options: ContactFilterData[];
  loading: boolean;
  /** True while appending the next page (infinite scroll). */
  loadingMore: boolean;
  /** Whether scroll can load another page. */
  hasMore: boolean;
  /** Current typeahead string for this facet. */
  searchText: string;
}

export interface UseContactFiltersReturn {
  filters: ContactFilter[];
  filtersLoading: boolean;
  /** Set when `getFilters` fails (e.g. API unavailable). */
  filtersError: string | null;
  sections: FilterSection[];
  /** Load first page of options when the facet opens. */
  loadFilterData: (filterKey: string) => Promise<void>;
  /** Append next page when the list is scrolled to the end. */
  loadMoreFilterData: (filterKey: string) => Promise<void>;
  /** Debounced search within facet options. */
  setFilterSearch: (filterKey: string, text: string) => void;
  /** Clear TTL cache and refetch filter definitions from the API. */
  refetchFiltersMetadata: () => Promise<void>;
}

export function useContactFilters(): UseContactFiltersReturn {
  const [filters, setFilters] = useState<ContactFilter[]>(
    () => readValidContactFiltersCache() ?? [],
  );
  const [filtersLoading, setFiltersLoading] = useState(
    () => readValidContactFiltersCache() == null,
  );
  const [filtersError, setFiltersError] = useState<string | null>(null);

  const {
    getState,
    openFilter,
    loadMore,
    setSearch,
    resetAll: resetFilterOptions,
  } = useFilterOptions();

  useEffect(() => {
    const cached = readValidContactFiltersCache();
    if (cached) {
      setFilters(cached);
      setFiltersLoading(false);
      setFiltersError(null);
      return;
    }
    let cancelled = false;
    setFiltersLoading(true);
    setFiltersError(null);
    contactsService
      .getFilters()
      .then((res) => {
        if (!cancelled) {
          const items = res.contacts.filters.items;
          setFilters(items);
          setFiltersError(null);
          if (items.length > 0) {
            writeTTLCache(
              CONTACT_FILTERS_CACHE_KEY,
              items,
              CONTACT_FILTERS_TTL_MS,
            );
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFilters([]);
          setFiltersError(
            err instanceof Error
              ? err.message
              : "Failed to load filter definitions",
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

  const sections: FilterSection[] = useMemo(
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
          hasMore: computeFilterHasMore(st),
          searchText: st.searchText,
        };
      }),
    [filters, getState],
  );

  const refetchFiltersMetadata = useCallback(async () => {
    clearTTLCache(CONTACT_FILTERS_CACHE_KEY);
    resetFilterOptions();
    setFiltersLoading(true);
    setFiltersError(null);
    try {
      const res = await contactsService.getFilters();
      const items = res.contacts.filters.items;
      setFilters(items);
      setFiltersError(null);
      if (items.length > 0) {
        writeTTLCache(CONTACT_FILTERS_CACHE_KEY, items, CONTACT_FILTERS_TTL_MS);
      }
    } catch (err: unknown) {
      setFilters([]);
      setFiltersError(
        err instanceof Error
          ? err.message
          : "Failed to load filter definitions",
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

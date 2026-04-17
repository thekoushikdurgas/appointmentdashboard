"use client";

import { useCallback, useRef, useState } from "react";
import { contactsService } from "@/services/graphql/contactsService";
import type { ContactFilterData } from "@/graphql/generated/types";

/** Page size for filter facet option requests (Connectra pagination). */
export const FILTER_OPTIONS_PAGE_SIZE = 50;

export interface FilterOptionsState {
  items: ContactFilterData[];
  /** Last successfully fetched page (1-based). */
  page: number;
  /** Total distinct values reported by API (may be 0 if unknown). */
  total: number;
  loading: boolean;
  loadingMore: boolean;
  /** Current search string for this facet. */
  searchText: string;
  /** Whether another page can be requested (see `setCanLoadMoreFromResponse`). */
  canLoadMore: boolean;
}

function emptyState(): FilterOptionsState {
  return {
    items: [],
    page: 0,
    total: 0,
    loading: false,
    loadingMore: false,
    searchText: "",
    canLoadMore: false,
  };
}

/** Derive whether more pages exist from a single page response. */
export function setCanLoadMoreFromResponse(
  mergedLength: number,
  resTotal: number,
  pageItemsLength: number,
  pageSize: number = FILTER_OPTIONS_PAGE_SIZE,
): boolean {
  if (pageItemsLength === 0) return false;
  if (resTotal > 0) return mergedLength < resTotal;
  return pageItemsLength >= pageSize;
}

/** Dedupe by `value` while preserving first occurrence order. */
export function dedupeFilterOptionsByValue(
  items: ContactFilterData[],
): ContactFilterData[] {
  const seen = new Set<string>();
  const out: ContactFilterData[] = [];
  for (const it of items) {
    const k = String(it.value ?? "");
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

/** Whether more pages can be loaded for infinite scroll. */
export function computeFilterHasMore(st: FilterOptionsState): boolean {
  if (st.loading || st.loadingMore) return false;
  return st.canLoadMore;
}

/**
 * Paginated + searchable filter option loader for contact facet keys.
 * Used by `useContactFilters` and tests.
 */
export function useFilterOptions() {
  const [byKey, setByKey] = useState<Record<string, FilterOptionsState>>({});
  const searchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  const clearTimer = (key: string) => {
    const t = searchTimers.current[key];
    if (t) clearTimeout(t);
    delete searchTimers.current[key];
  };

  const getState = useCallback(
    (filterKey: string): FilterOptionsState => byKey[filterKey] ?? emptyState(),
    [byKey],
  );

  const openFilter = useCallback(async (filterKey: string) => {
    setByKey((prev) => ({
      ...prev,
      [filterKey]: {
        ...(prev[filterKey] ?? emptyState()),
        loading: true,
        searchText: "",
      },
    }));
    try {
      const res = await contactsService.filterData({
        filterKey,
        page: 1,
        limit: FILTER_OPTIONS_PAGE_SIZE,
      });
      const items = dedupeFilterOptionsByValue(res.items);
      const canLoadMore = setCanLoadMoreFromResponse(
        items.length,
        res.total,
        res.items.length,
      );
      setByKey((prev) => ({
        ...prev,
        [filterKey]: {
          items,
          page: 1,
          total: res.total,
          loading: false,
          loadingMore: false,
          searchText: "",
          canLoadMore,
        },
      }));
    } catch {
      setByKey((prev) => ({
        ...prev,
        [filterKey]: {
          ...(prev[filterKey] ?? emptyState()),
          items: [],
          page: 0,
          total: 0,
          loading: false,
          loadingMore: false,
          searchText: "",
        },
      }));
    }
  }, []);

  const loadMore = useCallback(async (filterKey: string) => {
    let snapshot: FilterOptionsState | undefined;
    setByKey((prev) => {
      const s = prev[filterKey];
      if (!s || s.loading || s.loadingMore || !s.canLoadMore) return prev;
      snapshot = s;
      return {
        ...prev,
        [filterKey]: { ...s, loadingMore: true },
      };
    });
    if (!snapshot) return;
    const nextPage = snapshot.page + 1;
    try {
      const res = await contactsService.filterData({
        filterKey,
        page: nextPage,
        limit: FILTER_OPTIONS_PAGE_SIZE,
        searchText: snapshot.searchText.trim() || undefined,
      });
      setByKey((prev) => {
        const cur = prev[filterKey] ?? emptyState();
        const merged = dedupeFilterOptionsByValue([...cur.items, ...res.items]);
        const canLoadMore = setCanLoadMoreFromResponse(
          merged.length,
          Math.max(cur.total, res.total),
          res.items.length,
        );
        return {
          ...prev,
          [filterKey]: {
            ...cur,
            items: merged,
            page: nextPage,
            total: Math.max(cur.total, res.total),
            loadingMore: false,
            canLoadMore,
          },
        };
      });
    } catch {
      setByKey((prev) => ({
        ...prev,
        [filterKey]: {
          ...(prev[filterKey] ?? emptyState()),
          loadingMore: false,
        },
      }));
    }
  }, []);

  const setSearch = useCallback((filterKey: string, text: string) => {
    clearTimer(filterKey);
    setByKey((prev) => ({
      ...prev,
      [filterKey]: {
        ...(prev[filterKey] ?? emptyState()),
        searchText: text,
      },
    }));
    searchTimers.current[filterKey] = setTimeout(() => {
      void (async () => {
        setByKey((prev) => ({
          ...prev,
          [filterKey]: {
            ...(prev[filterKey] ?? emptyState()),
            loading: true,
          },
        }));
        try {
          const res = await contactsService.filterData({
            filterKey,
            page: 1,
            limit: FILTER_OPTIONS_PAGE_SIZE,
            searchText: text.trim() || undefined,
          });
          const items = dedupeFilterOptionsByValue(res.items);
          const canLoadMore = setCanLoadMoreFromResponse(
            items.length,
            res.total,
            res.items.length,
          );
          setByKey((prev) => ({
            ...prev,
            [filterKey]: {
              items,
              page: 1,
              total: res.total,
              loading: false,
              loadingMore: false,
              searchText: text,
              canLoadMore,
            },
          }));
        } catch {
          setByKey((prev) => ({
            ...prev,
            [filterKey]: {
              ...(prev[filterKey] ?? emptyState()),
              loading: false,
            },
          }));
        }
      })();
    }, 300);
  }, []);

  const resetAll = useCallback(() => {
    for (const k of Object.keys(searchTimers.current)) clearTimer(k);
    setByKey({});
  }, []);

  return {
    getState,
    openFilter,
    loadMore,
    setSearch,
    resetAll,
  };
}

"use client";

import { useCallback, useRef, useState } from "react";
import { contactsService } from "@/services/graphql/contactsService";
import type { ContactFilterData } from "@/graphql/generated/types";

/** Page size for filter facet option requests (Connectra pagination). */
export const FILTER_OPTIONS_PAGE_SIZE = 50;

/** Shared facet option row shape (contacts + companies). */
export type FacetFilterOptionRow = { value: string; displayValue: string };

export type FacetFilterState<T extends FacetFilterOptionRow> = {
  items: T[];
  /** Last successfully fetched page (1-based). */
  page: number;
  /** Total distinct values reported by API (may be 0 if unknown). */
  total: number;
  loading: boolean;
  loadingMore: boolean;
  /** Current search string for this facet. */
  searchText: string;
  /** Whether another page can be requested (see `canLoadMoreAfterPage`). */
  canLoadMore: boolean;
};

/** @deprecated Prefer `FacetFilterState<ContactFilterData>` */
export type FilterOptionsState = FacetFilterState<ContactFilterData>;

function emptyFacetState<
  T extends FacetFilterOptionRow,
>(): FacetFilterState<T> {
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

/**
 * Whether another facet page should be fetchable after merging this response.
 * Uses list growth (post-dedupe) and a short final page so we do not rely on a
 * possibly wrong `total` from the gateway, and we stop when a "full" page repeats
 * without adding distinct values.
 */
export function canLoadMoreAfterPage(
  prevMergedCount: number,
  mergedCount: number,
  pageItemsLength: number,
  pageSize: number = FILTER_OPTIONS_PAGE_SIZE,
): boolean {
  if (pageItemsLength === 0) return false;
  if (mergedCount <= prevMergedCount) return false;
  if (pageItemsLength < pageSize) return false;
  return true;
}

/** @deprecated Prefer `canLoadMoreAfterPage` (merge-aware). Kept for tests / callers. */
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
export function dedupeFilterOptionsByValue<T extends FacetFilterOptionRow>(
  items: T[],
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const k = String(it.value ?? "");
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

/** Whether more pages can be loaded for infinite scroll. */
export function computeFilterHasMore<T extends FacetFilterOptionRow>(
  st: FacetFilterState<T>,
): boolean {
  if (st.loading || st.loadingMore) return false;
  return st.canLoadMore;
}

type FetchFacetPage<T extends FacetFilterOptionRow> = (args: {
  filterKey: string;
  page: number;
  limit: number;
  searchText?: string;
}) => Promise<{ items: T[]; total: number }>;

/**
 * Generic paginated + searchable filter facet loader (contacts, companies, …).
 */
export function usePagedFacetFilterOptions<T extends FacetFilterOptionRow>(
  fetchPage: FetchFacetPage<T>,
) {
  const [byKey, setByKey] = useState<Record<string, FacetFilterState<T>>>({});
  const searchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  const clearTimer = (key: string) => {
    const t = searchTimers.current[key];
    if (t) clearTimeout(t);
    delete searchTimers.current[key];
  };

  const getState = useCallback(
    (filterKey: string): FacetFilterState<T> =>
      byKey[filterKey] ?? emptyFacetState<T>(),
    [byKey],
  );

  const openFilter = useCallback(
    async (filterKey: string) => {
      setByKey((prev) => ({
        ...prev,
        [filterKey]: {
          ...(prev[filterKey] ?? emptyFacetState<T>()),
          loading: true,
          searchText: "",
        },
      }));
      try {
        const res = await fetchPage({
          filterKey,
          page: 1,
          limit: FILTER_OPTIONS_PAGE_SIZE,
        });
        const items = dedupeFilterOptionsByValue(res.items);
        const canLoadMore = canLoadMoreAfterPage(
          0,
          items.length,
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
            ...(prev[filterKey] ?? emptyFacetState<T>()),
            items: [],
            page: 0,
            total: 0,
            loading: false,
            loadingMore: false,
            searchText: "",
            canLoadMore: false,
          },
        }));
      }
    },
    [fetchPage],
  );

  const loadMore = useCallback(
    async (filterKey: string) => {
      let snapshot: FacetFilterState<T> | undefined;
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
        const res = await fetchPage({
          filterKey,
          page: nextPage,
          limit: FILTER_OPTIONS_PAGE_SIZE,
          searchText: snapshot.searchText.trim() || undefined,
        });
        setByKey((prev) => {
          const cur = prev[filterKey] ?? emptyFacetState<T>();
          const merged = dedupeFilterOptionsByValue([
            ...cur.items,
            ...res.items,
          ]);
          const canLoadMore = canLoadMoreAfterPage(
            cur.items.length,
            merged.length,
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
            ...(prev[filterKey] ?? emptyFacetState<T>()),
            loadingMore: false,
          },
        }));
      }
    },
    [fetchPage],
  );

  const setSearch = useCallback(
    (filterKey: string, text: string) => {
      clearTimer(filterKey);
      setByKey((prev) => ({
        ...prev,
        [filterKey]: {
          ...(prev[filterKey] ?? emptyFacetState<T>()),
          searchText: text,
        },
      }));
      searchTimers.current[filterKey] = setTimeout(() => {
        void (async () => {
          setByKey((prev) => ({
            ...prev,
            [filterKey]: {
              ...(prev[filterKey] ?? emptyFacetState<T>()),
              loading: true,
            },
          }));
          try {
            const res = await fetchPage({
              filterKey,
              page: 1,
              limit: FILTER_OPTIONS_PAGE_SIZE,
              searchText: text.trim() || undefined,
            });
            const items = dedupeFilterOptionsByValue(res.items);
            const canLoadMore = canLoadMoreAfterPage(
              0,
              items.length,
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
                ...(prev[filterKey] ?? emptyFacetState<T>()),
                loading: false,
              },
            }));
          }
        })();
      }, 300);
    },
    [fetchPage],
  );

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

const fetchContactFacetPage: FetchFacetPage<ContactFilterData> = async (args) =>
  contactsService.filterData(args);

/**
 * Paginated + searchable filter option loader for contact facet keys.
 * Used by `useContactFilters` and tests.
 */
export function useFilterOptions() {
  return usePagedFacetFilterOptions(fetchContactFacetPage);
}

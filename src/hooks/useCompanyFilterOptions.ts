"use client";

import { useCallback, useRef, useState } from "react";
import { companiesService } from "@/services/graphql/companiesService";
import type { CompanyFilterData } from "@/graphql/generated/types";
import {
  FILTER_OPTIONS_PAGE_SIZE,
  dedupeFilterOptionsByValue,
  canLoadMoreAfterPage,
} from "@/hooks/useFilterOptions";

export interface CompanyFilterOptionsState {
  items: CompanyFilterData[];
  page: number;
  total: number;
  loading: boolean;
  loadingMore: boolean;
  searchText: string;
  canLoadMore: boolean;
}

function emptyState(): CompanyFilterOptionsState {
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

export function useCompanyFilterOptions() {
  const [byKey, setByKey] = useState<Record<string, CompanyFilterOptionsState>>(
    {},
  );
  const searchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  const clearTimer = (key: string) => {
    const t = searchTimers.current[key];
    if (t) clearTimeout(t);
    delete searchTimers.current[key];
  };

  const getState = useCallback(
    (filterKey: string): CompanyFilterOptionsState =>
      byKey[filterKey] ?? emptyState(),
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
      const res = await companiesService.filterData({
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
          ...(prev[filterKey] ?? emptyState()),
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
  }, []);

  const loadMore = useCallback(async (filterKey: string) => {
    let snapshot: CompanyFilterOptionsState | undefined;
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
      const res = await companiesService.filterData({
        filterKey,
        page: nextPage,
        limit: FILTER_OPTIONS_PAGE_SIZE,
        searchText: snapshot.searchText.trim() || undefined,
      });
      setByKey((prev) => {
        const cur = prev[filterKey] ?? emptyState();
        const merged = dedupeFilterOptionsByValue([...cur.items, ...res.items]);
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
          const res = await companiesService.filterData({
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

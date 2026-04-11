"use client";

import { useState, useEffect, useCallback } from "react";
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

export const CONTACT_FILTERS_CACHE_KEY = "c360:contact:filters:v1";
const CONTACT_FILTERS_TTL_MS = 30 * 60 * 1000;

export interface FilterSection {
  filterKey: string;
  displayName: string;
  filterType: string;
  options: ContactFilterData[];
  loading: boolean;
}

export interface UseContactFiltersReturn {
  filters: ContactFilter[];
  filtersLoading: boolean;
  sections: FilterSection[];
  loadFilterData: (filterKey: string) => Promise<void>;
  /** Clear TTL cache and refetch filter definitions from the API. */
  refetchFiltersMetadata: () => Promise<void>;
}

export function useContactFilters(): UseContactFiltersReturn {
  const [filters, setFilters] = useState<ContactFilter[]>(
    () => readTTLCache<ContactFilter[]>(CONTACT_FILTERS_CACHE_KEY) ?? [],
  );
  const [filtersLoading, setFiltersLoading] = useState(
    () => readTTLCache<ContactFilter[]>(CONTACT_FILTERS_CACHE_KEY) == null,
  );
  const [sectionData, setSectionData] = useState<
    Record<string, { options: ContactFilterData[]; loading: boolean }>
  >({});

  useEffect(() => {
    const cached = readTTLCache<ContactFilter[]>(CONTACT_FILTERS_CACHE_KEY);
    if (cached) {
      setFilters(cached);
      setFiltersLoading(false);
      return;
    }
    let cancelled = false;
    setFiltersLoading(true);
    contactsService
      .getFilters()
      .then((res) => {
        if (!cancelled) {
          const items = res.contacts.filters.items;
          setFilters(items);
          writeTTLCache(
            CONTACT_FILTERS_CACHE_KEY,
            items,
            CONTACT_FILTERS_TTL_MS,
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
      const res = await contactsService.filterData({ filterKey });
      setSectionData((prev) => ({
        ...prev,
        [filterKey]: {
          options: res.contacts.filterData.items,
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

  const sections: FilterSection[] = filters.map((f) => ({
    filterKey: f.filterKey,
    displayName: f.displayName,
    filterType: f.filterType,
    options: sectionData[f.filterKey]?.options ?? [],
    loading: sectionData[f.filterKey]?.loading ?? false,
  }));

  const refetchFiltersMetadata = useCallback(async () => {
    clearTTLCache(CONTACT_FILTERS_CACHE_KEY);
    setSectionData({});
    setFiltersLoading(true);
    try {
      const res = await contactsService.getFilters();
      const items = res.contacts.filters.items;
      setFilters(items);
      writeTTLCache(CONTACT_FILTERS_CACHE_KEY, items, CONTACT_FILTERS_TTL_MS);
    } catch {
      setFilters([]);
    } finally {
      setFiltersLoading(false);
    }
  }, []);

  return {
    filters,
    filtersLoading,
    sections,
    loadFilterData,
    refetchFiltersMetadata,
  };
}

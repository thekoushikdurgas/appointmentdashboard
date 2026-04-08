"use client";

import { useState, useEffect, useCallback } from "react";
import { contactsService } from "@/services/graphql/contactsService";
import type {
  ContactFilter,
  ContactFilterData,
} from "@/graphql/generated/types";

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
}

export function useContactFilters(): UseContactFiltersReturn {
  const [filters, setFilters] = useState<ContactFilter[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [sectionData, setSectionData] = useState<
    Record<string, { options: ContactFilterData[]; loading: boolean }>
  >({});

  useEffect(() => {
    let cancelled = false;
    setFiltersLoading(true);
    contactsService
      .getFilters()
      .then((res) => {
        if (!cancelled) {
          setFilters(res.contacts.filters.items);
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

  return { filters, filtersLoading, sections, loadFilterData };
}

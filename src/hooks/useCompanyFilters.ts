"use client";

import { useState, useEffect, useCallback } from "react";
import { companiesService } from "@/services/graphql/companiesService";
import type {
  CompanyFilter,
  CompanyFilterData,
} from "@/graphql/generated/types";

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
  const [filters, setFilters] = useState<CompanyFilter[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [sectionData, setSectionData] = useState<
    Record<string, { options: CompanyFilterData[]; loading: boolean }>
  >({});

  useEffect(() => {
    let cancelled = false;
    setFiltersLoading(true);
    companiesService
      .getFilters()
      .then((res) => {
        if (!cancelled) {
          setFilters(res.companies.filters.items);
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
          options: res.companies.filterData.items,
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

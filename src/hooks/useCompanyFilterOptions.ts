"use client";

import { companiesService } from "@/services/graphql/companiesService";
import type { CompanyFilterData } from "@/graphql/generated/types";
import {
  usePagedFacetFilterOptions,
  type FacetFilterState,
} from "@/hooks/useFilterOptions";

export type CompanyFilterOptionsState = FacetFilterState<CompanyFilterData>;

const fetchCompanyFacetPage = async (args: {
  filterKey: string;
  page: number;
  limit: number;
  searchText?: string;
}) => companiesService.filterData(args);

export function useCompanyFilterOptions() {
  return usePagedFacetFilterOptions(fetchCompanyFacetPage);
}

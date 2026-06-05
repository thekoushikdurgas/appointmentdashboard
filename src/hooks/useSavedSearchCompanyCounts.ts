"use client";

import { useCallback } from "react";
import type { VqlQueryInput } from "@/graphql/generated/types";
import { companyCountQueryFromSavedSearchFilters } from "@/lib/savedSearchPayload";
import { companiesService } from "@/services/graphql/companiesService";
import type { SavedSearch } from "@/services/graphql/savedSearchesService";
import {
  useSavedSearchEntityCounts,
  type SavedSearchEntityCountEntry,
} from "@/hooks/useSavedSearchEntityCounts";

export type SavedSearchCompanyCountEntry = SavedSearchEntityCountEntry;

/**
 * Fetches `companyCount` per saved search (deduped by cohort query). Only runs when `enabled`.
 */
export function useSavedSearchCompanyCounts(
  searches: SavedSearch[],
  enabled: boolean,
): Record<string, SavedSearchCompanyCountEntry> {
  const buildVql = useCallback(
    (filters: SavedSearch["filters"]) =>
      companyCountQueryFromSavedSearchFilters(filters),
    [],
  );
  const count = useCallback(
    (vql: VqlQueryInput) => companiesService.count(vql),
    [],
  );
  return useSavedSearchEntityCounts(searches, enabled, { buildVql, count });
}

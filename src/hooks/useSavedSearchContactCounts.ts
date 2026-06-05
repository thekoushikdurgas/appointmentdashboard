"use client";

import { useCallback } from "react";
import type { VqlQueryInput } from "@/graphql/generated/types";
import { contactVqlFromSavedSearchFilters } from "@/lib/savedSearchPayload";
import { contactsService } from "@/services/graphql/contactsService";
import type { SavedSearch } from "@/services/graphql/savedSearchesService";
import {
  useSavedSearchEntityCounts,
  type SavedSearchEntityCountEntry,
} from "@/hooks/useSavedSearchEntityCounts";

export type SavedSearchContactCountEntry = SavedSearchEntityCountEntry;

/**
 * Fetches `contactCount` per saved search (deduped by VQL). Only runs when `enabled`.
 */
export function useSavedSearchContactCounts(
  searches: SavedSearch[],
  enabled: boolean,
): Record<string, SavedSearchContactCountEntry> {
  const buildVql = useCallback(
    (filters: SavedSearch["filters"]) =>
      contactVqlFromSavedSearchFilters(filters),
    [],
  );
  const count = useCallback(
    (vql: VqlQueryInput) => contactsService.count(vql),
    [],
  );
  return useSavedSearchEntityCounts(searches, enabled, { buildVql, count });
}

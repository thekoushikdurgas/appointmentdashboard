"use client";

import { useEffect, useMemo, useState } from "react";
import type { VqlQueryInput } from "@/graphql/generated/types";
import { companyCountQueryFromSavedSearchFilters } from "@/lib/savedSearchPayload";
import { companiesService } from "@/services/graphql/companiesService";
import type { SavedSearch } from "@/services/graphql/savedSearchesService";

export type SavedSearchCompanyCountEntry =
  | { status: "loading" }
  | { status: "ready"; value: number }
  | { status: "error" };

const COUNT_CONCURRENCY = 2;

function stableVqlKey(vql: VqlQueryInput): string {
  try {
    return JSON.stringify(vql);
  } catch {
    return String(Date.now());
  }
}

/**
 * Fetches `companyCount` per saved search (deduped by cohort query). Only runs when `enabled`.
 */
export function useSavedSearchCompanyCounts(
  searches: SavedSearch[],
  enabled: boolean,
): Record<string, SavedSearchCompanyCountEntry> {
  const [counts, setCounts] = useState<
    Record<string, SavedSearchCompanyCountEntry>
  >({});

  const fetchSignature = useMemo(() => {
    if (!enabled || searches.length === 0) return "";
    return searches
      .map((s) => {
        const vql = companyCountQueryFromSavedSearchFilters(s.filters);
        return vql ? `${s.id}:${stableVqlKey(vql)}` : `${s.id}:none`;
      })
      .join("|");
  }, [searches, enabled]);

  useEffect(() => {
    if (!fetchSignature) {
      setCounts({});
      return;
    }

    let cancelled = false;

    const vqlGroups = new Map<string, { vql: VqlQueryInput; ids: string[] }>();
    for (const s of searches) {
      const vql = companyCountQueryFromSavedSearchFilters(s.filters);
      if (!vql) continue;
      const key = stableVqlKey(vql);
      const existing = vqlGroups.get(key);
      if (existing) existing.ids.push(s.id);
      else vqlGroups.set(key, { vql, ids: [s.id] });
    }

    const loadingIds = [...vqlGroups.values()].flatMap((g) => g.ids);
    setCounts((prev) => {
      const next = { ...prev };
      for (const id of loadingIds) next[id] = { status: "loading" };
      return next;
    });

    const groups = [...vqlGroups.values()];

    const run = async () => {
      for (let i = 0; i < groups.length; i += COUNT_CONCURRENCY) {
        if (cancelled) return;
        const batch = groups.slice(i, i + COUNT_CONCURRENCY);
        await Promise.all(
          batch.map(async ({ vql, ids }) => {
            try {
              const value = await companiesService.count(vql);
              if (cancelled) return;
              setCounts((prev) => {
                const next = { ...prev };
                for (const id of ids) next[id] = { status: "ready", value };
                return next;
              });
            } catch {
              if (cancelled) return;
              setCounts((prev) => {
                const next = { ...prev };
                for (const id of ids) next[id] = { status: "error" };
                return next;
              });
            }
          }),
        );
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [fetchSignature, searches]);

  return counts;
}

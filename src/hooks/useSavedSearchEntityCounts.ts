"use client";

import { useEffect, useMemo, useState } from "react";
import type { VqlQueryInput } from "@/graphql/generated/types";
import type { SavedSearch } from "@/services/graphql/savedSearchesService";

export type SavedSearchEntityCountEntry =
  | { status: "loading" }
  | { status: "ready"; value: number }
  | { status: "error" };

const COUNT_CONCURRENCY = 2;

function stableVqlKey(vql: Partial<VqlQueryInput>): string {
  try {
    return JSON.stringify(vql);
  } catch {
    return String(Date.now());
  }
}

export interface UseSavedSearchEntityCountsOptions {
  buildVql: (
    filters: SavedSearch["filters"],
  ) => Partial<VqlQueryInput> | null | undefined;
  count: (vql: VqlQueryInput) => Promise<number>;
}

/**
 * Fetches entity counts per saved search (deduped by VQL). Only runs when `enabled`.
 */
export function useSavedSearchEntityCounts(
  searches: SavedSearch[],
  enabled: boolean,
  { buildVql, count }: UseSavedSearchEntityCountsOptions,
): Record<string, SavedSearchEntityCountEntry> {
  const [counts, setCounts] = useState<
    Record<string, SavedSearchEntityCountEntry>
  >({});

  const fetchSignature = useMemo(() => {
    if (!enabled || searches.length === 0) return "";
    return searches
      .map((s) => {
        const vql = buildVql(s.filters);
        return vql ? `${s.id}:${stableVqlKey(vql)}` : `${s.id}:none`;
      })
      .join("|");
  }, [searches, enabled, buildVql]);

  useEffect(() => {
    if (!fetchSignature) {
      setCounts({});
      return;
    }

    let cancelled = false;

    const vqlGroups = new Map<
      string,
      { vql: Partial<VqlQueryInput>; ids: string[] }
    >();
    for (const s of searches) {
      const vql = buildVql(s.filters);
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
              const value = await count(vql as VqlQueryInput);
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
  }, [fetchSignature, searches, buildVql, count]);

  return counts;
}

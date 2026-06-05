"use client";

import { useEffect, useMemo, useState } from "react";
import {
  effectivePostedBounds,
  parseLinkedInJobsPayload,
} from "@/lib/jobs/hiringSignalJobRows";
import {
  hireSignalSavedSearchCountKeyFromFilters,
  type HireSignalSavedSearchCountKey,
} from "@/lib/savedSearchPayload";
import { fetchHiringSignalJobs } from "@/services/graphql/hiringSignalService";
import type { SavedSearch } from "@/services/graphql/savedSearchesService";

export type SavedSearchHireSignalJobCountEntry =
  | { status: "loading" }
  | { status: "ready"; value: number }
  | { status: "error" };

const COUNT_CONCURRENCY = 2;

function stableHireSignalKey(key: HireSignalSavedSearchCountKey): string {
  try {
    return JSON.stringify(key);
  } catch {
    return String(Date.now());
  }
}

async function fetchHireSignalJobCount(
  key: HireSignalSavedSearchCountKey,
): Promise<number> {
  const res = await fetchHiringSignalJobs({
    ...key.listFilters,
    ...effectivePostedBounds(key.signalTimePreset, {
      postedAfter: key.listFilters.postedAfter,
      postedBefore: key.listFilters.postedBefore,
    }),
    limit: 1,
    offset: 0,
  });
  const parsed = parseLinkedInJobsPayload(res.hireSignal?.jobs);
  return parsed.total;
}

/**
 * Fetches matching job totals per saved hiring-signal view (deduped by filter set).
 */
export function useSavedSearchHireSignalJobCounts(
  searches: SavedSearch[],
  enabled: boolean,
): Record<string, SavedSearchHireSignalJobCountEntry> {
  const [counts, setCounts] = useState<
    Record<string, SavedSearchHireSignalJobCountEntry>
  >({});

  const fetchSignature = useMemo(() => {
    if (!enabled || searches.length === 0) return "";
    return searches
      .map((s) => {
        const key = hireSignalSavedSearchCountKeyFromFilters(s.filters);
        return key ? `${s.id}:${stableHireSignalKey(key)}` : `${s.id}:none`;
      })
      .join("|");
  }, [searches, enabled]);

  useEffect(() => {
    if (!fetchSignature) {
      setCounts({});
      return;
    }

    let cancelled = false;

    const filterGroups = new Map<
      string,
      { key: HireSignalSavedSearchCountKey; ids: string[] }
    >();
    for (const s of searches) {
      const key = hireSignalSavedSearchCountKeyFromFilters(s.filters);
      if (!key) continue;
      const sig = stableHireSignalKey(key);
      const existing = filterGroups.get(sig);
      if (existing) existing.ids.push(s.id);
      else filterGroups.set(sig, { key, ids: [s.id] });
    }

    const loadingIds = [...filterGroups.values()].flatMap((g) => g.ids);
    setCounts((prev) => {
      const next = { ...prev };
      for (const id of loadingIds) next[id] = { status: "loading" };
      return next;
    });

    const groups = [...filterGroups.values()];

    const run = async () => {
      for (let i = 0; i < groups.length; i += COUNT_CONCURRENCY) {
        if (cancelled) return;
        const batch = groups.slice(i, i + COUNT_CONCURRENCY);
        await Promise.all(
          batch.map(async ({ key, ids }) => {
            try {
              const value = await fetchHireSignalJobCount(key);
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
  }, [fetchSignature, searches, enabled]);

  return counts;
}

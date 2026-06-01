"use client";

import { useEffect, useMemo, useState } from "react";
import {
  effectivePostedAfter,
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
    postedAfter: effectivePostedAfter(
      key.signalTimePreset,
      key.listFilters.postedAfter,
    ),
    limit: 1,
    offset: 0,
  });
  const parsed = parseLinkedInJobsPayload(res.hireSignal?.jobs);
  // #region agent log
  fetch("http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "ad0071",
    },
    body: JSON.stringify({
      sessionId: "ad0071",
      location: "useSavedSearchHireSignalJobCounts.ts:fetchHireSignalJobCount",
      message: "hire signal saved search job count",
      data: {
        preset: key.signalTimePreset,
        total: parsed.total,
        hasJobsField: Boolean(res.hireSignal?.jobs),
      },
      timestamp: Date.now(),
      hypothesisId: "C",
      runId: "pre-fix",
    }),
  }).catch(() => { });
  // #endregion
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
    let skippedNoKey = 0;
    for (const s of searches) {
      const key = hireSignalSavedSearchCountKeyFromFilters(s.filters);
      if (!key) {
        skippedNoKey += 1;
        continue;
      }
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
    // #region agent log
    fetch("http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "ad0071",
      },
      body: JSON.stringify({
        sessionId: "ad0071",
        location: "useSavedSearchHireSignalJobCounts.ts:useEffect",
        message: "hire signal count fetch plan",
        data: {
          enabled,
          searchCount: searches.length,
          groupCount: groups.length,
          skippedNoKey,
        },
        timestamp: Date.now(),
        hypothesisId: "B",
        runId: "pre-fix",
      }),
    }).catch(() => { });
    // #endregion

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
  }, [fetchSignature, searches]);

  return counts;
}

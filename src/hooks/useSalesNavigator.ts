"use client";
import { useState, useEffect, useCallback } from "react";
import {
  salesNavigatorService,
  UserScrapingRecord,
  SalesNavigatorProfile,
  SaveProfilesResponse,
} from "@/services/graphql/salesNavigatorService";
import {
  SALES_NAV_SAVE_MAX_PROFILES,
  chunkArray,
  parseProfilesJsonArray,
} from "@/lib/salesNavigatorBulk";

export function useSalesNavigator(opts?: { limit?: number }) {
  const [records, setRecords] = useState<UserScrapingRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = opts?.limit ?? 50;

  const fetchRecords = useCallback(
    async (newOffset = 0) => {
      setLoading(true);
      setError(null);
      try {
        const res = await salesNavigatorService.listRecords({
          limit,
          offset: newOffset,
        });
        const conn = res.salesNavigator.salesNavigatorRecords;
        setRecords(conn.items);
        setTotal(conn.pageInfo.total);
        setHasNext(conn.pageInfo.hasNext);
        setHasPrevious(conn.pageInfo.hasPrevious);
        setOffset(newOffset);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    void fetchRecords(0);
  }, [fetchRecords]);

  const saveProfiles = useCallback(
    async (
      profiles: SalesNavigatorProfile[],
    ): Promise<SaveProfilesResponse> => {
      setSaving(true);
      try {
        const res = await salesNavigatorService.saveProfilesFromForms({
          profiles,
        });
        await fetchRecords(offset);
        return res.salesNavigator.saveSalesNavigatorProfiles;
      } finally {
        setSaving(false);
      }
    },
    [fetchRecords, offset],
  );

  /** Paste JSON array (snake_case objects); chunks at 1000 profiles per request. */
  const saveProfilesBulkJson = useCallback(
    async (
      rawJson: string,
    ): Promise<{
      totalProfiles: number;
      savedCount: number;
      errors: string[];
    }> => {
      const items = parseProfilesJsonArray(rawJson);
      setSaving(true);
      try {
        let savedCount = 0;
        const errors: string[] = [];
        for (const chunk of chunkArray(items, SALES_NAV_SAVE_MAX_PROFILES)) {
          const res = await salesNavigatorService.saveSalesNavigatorProfiles({
            profiles: chunk,
          });
          const r = res.salesNavigator.saveSalesNavigatorProfiles;
          savedCount += r.savedCount;
          errors.push(...r.errors);
        }
        await fetchRecords(offset);
        return {
          totalProfiles: items.length,
          savedCount,
          errors,
        };
      } finally {
        setSaving(false);
      }
    },
    [fetchRecords, offset],
  );

  const nextPage = useCallback(() => {
    if (hasNext) void fetchRecords(offset + limit);
  }, [fetchRecords, hasNext, offset, limit]);

  const prevPage = useCallback(() => {
    if (hasPrevious) void fetchRecords(Math.max(0, offset - limit));
  }, [fetchRecords, hasPrevious, offset, limit]);

  return {
    records,
    total,
    hasNext,
    hasPrevious,
    offset,
    limit,
    loading,
    saving,
    error,
    saveProfiles,
    saveProfilesBulkJson,
    refresh: () => fetchRecords(offset),
    nextPage,
    prevPage,
  };
}

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  type Company,
  companiesService,
} from "@/services/graphql/companiesService";
import type { VqlQueryInput } from "@/graphql/generated/types";
import { buildCompanyListVql } from "@/lib/companyListVql";
import {
  readCompaniesPageSizePreference,
  writeCompaniesPageSizePreference,
} from "@/lib/companiesListPrefs";
import {
  companiesListCacheKey,
  readCompaniesListCache,
  writeCompaniesListCache,
} from "@/lib/companiesListCache";

const DEFAULT_PAGE_SIZE = 25;
const EXPORT_VQL_LIMIT = 50_000;
const MIN_PAGE = 10;
const MAX_PAGE = 100;

export function useCompanies(initialVql?: Partial<VqlQueryInput>) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(() =>
    typeof window === "undefined"
      ? DEFAULT_PAGE_SIZE
      : readCompaniesPageSizePreference(),
  );
  const [sortBy, setSortByState] = useState("newest");
  const [search, setSearchState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vqlQuery, setVqlQuery] = useState<Partial<VqlQueryInput>>(
    initialVql ?? {},
  );
  const fetchSeq = useRef(0);
  const cursorsForPageRef = useRef<Map<number, string[]>>(new Map());

  const setPageSize = useCallback((n: number) => {
    const next = Math.min(
      MAX_PAGE,
      Math.max(MIN_PAGE, Math.trunc(n) || DEFAULT_PAGE_SIZE),
    );
    setPageSizeState(next);
    writeCompaniesPageSizePreference(next);
    setPage(1);
  }, []);

  const setSortBy = useCallback((s: string) => {
    setSortByState(s);
    setPage(1);
    cursorsForPageRef.current.clear();
  }, []);

  const loadCompanies = useCallback(
    async (opts?: { force?: boolean }) => {
      const seq = ++fetchSeq.current;
      const useListCache = page <= 10;
      const cacheKey = companiesListCacheKey(
        vqlQuery,
        page,
        pageSize,
        sortBy,
        search,
      );

      if (useListCache && !opts?.force) {
        const cached = readCompaniesListCache(cacheKey);
        if (cached) {
          setCompanies(cached.items);
          setTotal(cached.total);
          setError(null);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);
      try {
        const cursor =
          page > 10 ? cursorsForPageRef.current.get(page) : undefined;
        const useCursor = page > 10 && !!cursor?.length;
        const listQuery = buildCompanyListVql(
          page,
          pageSize,
          search,
          vqlQuery,
          {
            searchAfter: useCursor ? cursor : null,
            sortBy,
          },
        );
        // #region agent log
        globalThis
          .fetch(
            "http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Debug-Session-Id": "c73258",
              },
              body: JSON.stringify({
                sessionId: "c73258",
                runId: "company-facet",
                hypothesisId: "IF1",
                location: "useCompanies.ts:loadCompanies:start",
                message: "companies list fetch",
                data: {
                  seq,
                  page,
                  sortBy,
                  searchLen: search.length,
                  orderBy: listQuery.orderBy,
                  filterKeys: vqlQuery.filters
                    ? Object.keys(vqlQuery.filters as object)
                    : [],
                  filters: vqlQuery.filters,
                },
                timestamp: Date.now(),
              }),
            },
          )
          .catch(() => {});
        // #endregion
        const listResult = await companiesService.list(listQuery);
        if (seq !== fetchSeq.current) return;
        let { items, total: cohortTotal, nextSearchAfter } = listResult;
        if (sortBy === "contacts_asc" || sortBy === "contacts_desc") {
          const dir = sortBy === "contacts_desc" ? -1 : 1;
          items = [...items].sort(
            (a, b) => dir * ((a.contactCount ?? 0) - (b.contactCount ?? 0)),
          );
        }
        setCompanies(items);
        setTotal(cohortTotal);
        if (useListCache) {
          writeCompaniesListCache(cacheKey, items, cohortTotal);
        }
        // #region agent log
        globalThis
          .fetch(
            "http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Debug-Session-Id": "c73258",
              },
              body: JSON.stringify({
                sessionId: "c73258",
                runId: "company-facet",
                hypothesisId: "IF2",
                location: "useCompanies.ts:loadCompanies:done",
                message: "companies list fetch done",
                data: {
                  seq,
                  itemCount: items.length,
                  cohortTotal,
                  firstIndustries: items
                    .slice(0, 3)
                    .map((c) => c.industries ?? c.industry),
                  firstContactCounts: items.slice(0, 3).map((c) => ({
                    name: c.name,
                    contactCount: c.contactCount,
                  })),
                },
                timestamp: Date.now(),
              }),
            },
          )
          .catch(() => {});
        // #endregion
        if (nextSearchAfter?.length) {
          cursorsForPageRef.current.set(page + 1, nextSearchAfter);
        }
      } catch (err) {
        if (seq !== fetchSeq.current) return;
        const msg =
          err instanceof Error ? err.message : "Failed to load companies";
        // #region agent log
        globalThis
          .fetch(
            "http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Debug-Session-Id": "c73258",
              },
              body: JSON.stringify({
                sessionId: "c73258",
                runId: "company-sort",
                hypothesisId: "SORT_ERR",
                location: "useCompanies.ts:loadCompanies:error",
                message: "companies list fetch failed",
                data: { seq, sortBy, error: msg },
                timestamp: Date.now(),
              }),
            },
          )
          .catch(() => {});
        // #endregion
        setError(msg);
        setCompanies([]);
        setTotal(0);
      } finally {
        if (seq === fetchSeq.current) setLoading(false);
      }
    },
    [page, pageSize, search, vqlQuery, sortBy],
  );

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const applyVqlQuery = useCallback((q: Partial<VqlQueryInput>) => {
    cursorsForPageRef.current.clear();
    setCompanies([]);
    setVqlQuery(q);
    setPage(1);
  }, []);

  const exportVql = useMemo((): VqlQueryInput => {
    const base = buildCompanyListVql(1, EXPORT_VQL_LIMIT, search, vqlQuery, {
      searchAfter: null,
      sortBy,
    });
    return {
      ...(base as VqlQueryInput),
      limit: EXPORT_VQL_LIMIT,
      offset: 0,
      searchAfter: undefined,
    };
  }, [search, vqlQuery, sortBy]);

  const setSearch = useCallback((s: string) => {
    setSearchState(s);
    setPage(1);
    cursorsForPageRef.current.clear();
    setCompanies([]);
  }, []);

  const hasMore = page * pageSize < total;

  return {
    companies,
    total,
    page,
    pageSize,
    setPage,
    setPageSize,
    sortBy,
    setSortBy,
    search,
    setSearch,
    loading,
    error,
    vqlQuery,
    applyVqlQuery,
    exportVql,
    refresh: loadCompanies,
    hasMore,
  };
}

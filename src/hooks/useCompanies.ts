"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  type Company,
  companiesService,
} from "@/services/graphql/companiesService";
import type { VqlQueryInput } from "@/graphql/generated/types";
import {
  buildCompanyCountQueryInput,
  buildCompanyListVql,
} from "@/lib/companyListVql";
import {
  readCompaniesPageSizePreference,
  writeCompaniesPageSizePreference,
} from "@/lib/companiesListPrefs";

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

  const fetch = useCallback(async () => {
    const seq = ++fetchSeq.current;
    setLoading(true);
    setError(null);
    try {
      const cursor =
        page > 10 ? cursorsForPageRef.current.get(page) : undefined;
      const useCursor = page > 10 && !!cursor?.length;
      const listQuery = buildCompanyListVql(page, pageSize, search, vqlQuery, {
        searchAfter: useCursor ? cursor : null,
        sortBy,
      });
      const countQuery = buildCompanyCountQueryInput(search, vqlQuery, sortBy);
      const listP = companiesService.list(listQuery);
      const countP = companiesService
        .count(countQuery)
        .catch(() => null as number | null);
      const [listResult, countResult] = await Promise.all([listP, countP]);
      if (seq !== fetchSeq.current) return;
      const { items, total: listTotal, nextSearchAfter } = listResult;
      const cohortTotal =
        typeof countResult === "number" && countResult >= 0
          ? countResult
          : listTotal;
      setCompanies(items);
      setTotal(cohortTotal);
      if (nextSearchAfter?.length) {
        cursorsForPageRef.current.set(page + 1, nextSearchAfter);
      }
    } catch (err) {
      if (seq !== fetchSeq.current) return;
      const msg =
        err instanceof Error ? err.message : "Failed to load companies";
      setError(msg);
      setCompanies([]);
      setTotal(0);
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
    }
  }, [page, pageSize, search, vqlQuery, sortBy]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const applyVqlQuery = useCallback((q: Partial<VqlQueryInput>) => {
    cursorsForPageRef.current.clear();
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
    refresh: fetch,
    hasMore,
  };
}

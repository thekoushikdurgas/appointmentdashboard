"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  type Company,
  companiesService,
} from "@/services/graphql/companiesService";
import type { VqlQueryInput } from "@/graphql/generated/types";
import { buildCompanyListVql } from "@/lib/companyListVql";

const PAGE_SIZE = 25;
const EXPORT_VQL_LIMIT = 50_000;

export function useCompanies(initialVql?: Partial<VqlQueryInput>) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vqlQuery, setVqlQuery] = useState<Partial<VqlQueryInput>>(
    initialVql ?? {},
  );
  const cursorsForPageRef = useRef<Map<number, string[]>>(new Map());

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cursor =
        page > 10 ? cursorsForPageRef.current.get(page) : undefined;
      const useCursor = page > 10 && !!cursor?.length;
      const query = buildCompanyListVql(page, PAGE_SIZE, search, vqlQuery, {
        searchAfter: useCursor ? cursor : null,
      });
      const {
        items,
        total: t,
        nextSearchAfter,
      } = await companiesService.list(query);
      setCompanies(items);
      setTotal(t);
      if (nextSearchAfter?.length) {
        cursorsForPageRef.current.set(page + 1, nextSearchAfter);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load companies";
      setError(msg);
      setCompanies([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, vqlQuery]);

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
    });
    return {
      ...(base as VqlQueryInput),
      limit: EXPORT_VQL_LIMIT,
      offset: 0,
      searchAfter: undefined,
    };
  }, [search, vqlQuery]);

  const setSearch = useCallback((s: string) => {
    setSearchState(s);
    setPage(1);
  }, []);

  const hasMore = page * PAGE_SIZE < total;

  return {
    companies,
    total,
    page,
    pageSize: PAGE_SIZE,
    setPage,
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

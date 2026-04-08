"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = buildCompanyListVql(page, PAGE_SIZE, search, vqlQuery);
      const { items, total: t } = await companiesService.list(query);
      setCompanies(items);
      setTotal(t);
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
    setVqlQuery(q);
    setPage(1);
  }, []);

  const exportVql = useMemo((): VqlQueryInput => {
    const base = buildCompanyListVql(1, EXPORT_VQL_LIMIT, search, vqlQuery);
    return {
      ...(base as VqlQueryInput),
      limit: EXPORT_VQL_LIMIT,
      offset: 0,
    };
  }, [search, vqlQuery]);

  const setSearch = useCallback((s: string) => {
    setSearchState(s);
    setPage(1);
  }, []);

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
  };
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { contactsService } from "@/services/graphql/contactsService";
import type { Contact } from "@/services/graphql/contactsService";
import type { VqlQueryInput } from "@/graphql/generated/types";

const DEFAULT_PAGE_SIZE = 25;
/** Upper bound for export VQL; gateway/Connectra may apply its own caps. */
const EXPORT_VQL_LIMIT = 50_000;

export function useContacts(initialQuery?: Partial<VqlQueryInput>) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vqlQuery, setVqlQuery] = useState<Partial<VqlQueryInput>>(
    initialQuery ?? {},
  );

  const setPageSize = useCallback((n: number) => {
    const next = Math.min(
      100,
      Math.max(10, Math.trunc(n) || DEFAULT_PAGE_SIZE),
    );
    setPageSizeState(next);
    setPage(1);
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * pageSize;
      const query: VqlQueryInput = {
        limit: pageSize,
        offset,
        ...vqlQuery,
      };
      const { items, total: t } = await contactsService.list(query);
      setContacts(items);
      setTotal(t);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load contacts";
      setError(msg);
      setContacts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, vqlQuery]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const applyVqlQuery = useCallback((q: Partial<VqlQueryInput>) => {
    setVqlQuery(q);
    setPage(1);
  }, []);

  /** VQL for `CreateContact360ExportInput.vql` — same filters as the list, wide limit. */
  const exportVql = useMemo((): VqlQueryInput => {
    return {
      ...(vqlQuery as VqlQueryInput),
      limit: EXPORT_VQL_LIMIT,
      offset: 0,
    };
  }, [vqlQuery]);

  return {
    contacts,
    total,
    page,
    pageSize,
    setPage,
    setPageSize,
    loading,
    error,
    vqlQuery,
    exportVql,
    applyVqlQuery,
    refresh: fetch,
  };
}

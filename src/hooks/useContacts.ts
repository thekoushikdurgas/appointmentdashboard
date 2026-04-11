"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { contactsService } from "@/services/graphql/contactsService";
import type { Contact } from "@/services/graphql/contactsService";
import type { VqlQueryInput } from "@/graphql/generated/types";
import {
  clearAllContactsListCaches,
  contactsListCacheKey,
  pruneExpiredContactsListCaches,
  readContactsListCache,
  writeContactsListCache,
} from "@/lib/contactsListCache";

const DEFAULT_PAGE_SIZE = 25;
/** Upper bound for export VQL; gateway/Connectra may apply its own caps. */
const EXPORT_VQL_LIMIT = 50_000;

function schedulePrefetchNextPage(
  vqlQuery: Partial<VqlQueryInput>,
  currentPage: number,
  pageSize: number,
  total: number,
): void {
  const nextPage = currentPage + 1;
  if (nextPage < 2 || (nextPage - 1) * pageSize >= total) return;
  const nextKey = contactsListCacheKey(vqlQuery, nextPage, pageSize);
  if (readContactsListCache(nextKey)) return;
  const offset = (nextPage - 1) * pageSize;
  const query: VqlQueryInput = {
    limit: pageSize,
    offset,
    ...vqlQuery,
  };
  void contactsService
    .list(query)
    .then((r) => {
      writeContactsListCache(nextKey, r.items, r.total);
    })
    .catch(() => {});
}

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
  const fetchSeq = useRef(0);

  const setPageSize = useCallback((n: number) => {
    const next = Math.min(
      100,
      Math.max(10, Math.trunc(n) || DEFAULT_PAGE_SIZE),
    );
    setPageSizeState(next);
    setPage(1);
  }, []);

  const loadContacts = useCallback(
    async (opts?: { force?: boolean }) => {
      pruneExpiredContactsListCaches();
      const cacheKey = contactsListCacheKey(vqlQuery, page, pageSize);

      if (!opts?.force) {
        const cached = readContactsListCache(cacheKey);
        if (cached) {
          setContacts(cached.items);
          setTotal(cached.total);
          setError(null);
          setLoading(false);
          schedulePrefetchNextPage(vqlQuery, page, pageSize, cached.total);
          return;
        }
      } else {
        clearAllContactsListCaches();
      }

      const seq = ++fetchSeq.current;
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
        if (seq !== fetchSeq.current) return;
        setContacts(items);
        setTotal(t);
        writeContactsListCache(cacheKey, items, t);
        schedulePrefetchNextPage(vqlQuery, page, pageSize, t);
      } catch (err) {
        if (seq !== fetchSeq.current) return;
        const msg =
          err instanceof Error ? err.message : "Failed to load contacts";
        setError(msg);
        setContacts([]);
        setTotal(0);
      } finally {
        if (seq === fetchSeq.current) setLoading(false);
      }
    },
    [page, pageSize, vqlQuery],
  );

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

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

  const refresh = useCallback(
    () => loadContacts({ force: true }),
    [loadContacts],
  );

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
    refresh,
  };
}

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
  readContactsPageSizePreference,
  writeContactsPageSizePreference,
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
  if (currentPage >= 10) return;
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
      // Use cohort total from contactCount (passed in), not list `total` (often wrong).
      writeContactsListCache(nextKey, r.items, total);
    })
    .catch(() => {});
}

export function useContacts(initialQuery?: Partial<VqlQueryInput>) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(() =>
    typeof window === "undefined"
      ? DEFAULT_PAGE_SIZE
      : readContactsPageSizePreference(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vqlQuery, setVqlQuery] = useState<Partial<VqlQueryInput>>(
    initialQuery ?? {},
  );
  const fetchSeq = useRef(0);
  /** ``searchAfter`` to use when requesting page ``P`` (``P > 10``). */
  const cursorsForPageRef = useRef<Map<number, string[]>>(new Map());

  const setPageSize = useCallback((n: number) => {
    const next = Math.min(
      100,
      Math.max(10, Math.trunc(n) || DEFAULT_PAGE_SIZE),
    );
    setPageSizeState(next);
    writeContactsPageSizePreference(next);
    setPage(1);
  }, []);

  const loadContacts = useCallback(
    async (opts?: { force?: boolean }) => {
      pruneExpiredContactsListCaches();
      const seq = ++fetchSeq.current;
      const useListCache = page <= 10;
      const cacheKey = contactsListCacheKey(vqlQuery, page, pageSize);

      if (useListCache && !opts?.force) {
        const cached = readContactsListCache(cacheKey);
        if (cached) {
          setContacts(cached.items);
          setError(null);
          setLoading(false);
          try {
            const cohortTotal = await contactsService.count(
              vqlQuery as VqlQueryInput,
            );
            if (seq !== fetchSeq.current) return;
            setTotal(cohortTotal);
            schedulePrefetchNextPage(vqlQuery, page, pageSize, cohortTotal);
          } catch (err) {
            if (seq !== fetchSeq.current) return;
            setTotal(cached.total);
            schedulePrefetchNextPage(vqlQuery, page, pageSize, cached.total);
          }
          return;
        }
      } else if (opts?.force) {
        clearAllContactsListCaches();
      }

      setLoading(true);
      setError(null);
      try {
        const cursor =
          page > 10 ? cursorsForPageRef.current.get(page) : undefined;
        const useCursor = page > 10 && !!cursor?.length;
        const offset = useCursor ? 0 : (page - 1) * pageSize;
        const query: VqlQueryInput = {
          ...vqlQuery,
          limit: pageSize,
          offset,
          ...(useCursor && cursor ? { searchAfter: cursor } : {}),
        };
        const listP = contactsService.list(query);
        const countP = contactsService
          .count(vqlQuery as VqlQueryInput)
          .catch(() => null as number | null);
        const [listResult, countResult] = await Promise.all([listP, countP]);
        if (seq !== fetchSeq.current) return;
        const { items, total: listTotal, nextSearchAfter } = listResult;
        const cohortTotal =
          typeof countResult === "number" && countResult >= 0
            ? countResult
            : listTotal;
        setContacts(items);
        setTotal(cohortTotal);
        if (nextSearchAfter?.length) {
          cursorsForPageRef.current.set(page + 1, nextSearchAfter);
        }
        if (useListCache) {
          writeContactsListCache(cacheKey, items, cohortTotal);
          schedulePrefetchNextPage(vqlQuery, page, pageSize, cohortTotal);
        }
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
    clearAllContactsListCaches();
    cursorsForPageRef.current.clear();
    setVqlQuery(q);
    setPage(1);
  }, []);

  /** VQL for `CreateContact360ExportInput.vql` — same filters as the list, wide limit. */
  const exportVql = useMemo((): VqlQueryInput => {
    return {
      ...(vqlQuery as VqlQueryInput),
      limit: EXPORT_VQL_LIMIT,
      offset: 0,
      searchAfter: undefined,
    };
  }, [vqlQuery]);

  const hasMore = page * pageSize < total;

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
    hasMore,
  };
}

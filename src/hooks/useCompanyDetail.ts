"use client";

import { useState, useEffect, useCallback } from "react";
import {
  companiesService,
  mapCompanyContactRow,
  type Company,
} from "@/services/graphql/companiesService";
import { readStashedCompanyRow } from "@/lib/companyRowSession";
import type { Contact } from "@/services/graphql/contactsService";
import {
  contactListOrderByFromSortBy,
  isContactListSortBy,
} from "@/lib/contactListSort";

const CONTACTS_PAGE_SIZE = 20;

export interface UseCompanyDetailReturn {
  company: Company | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  contacts: Contact[];
  contactsTotal: number;
  contactsPage: number;
  contactsSortBy: string;
  setContactsSortBy: (sort: string) => void;
  contactsLoading: boolean;
  contactsError: string | null;
  setContactsPage: (page: number) => void;
  loadContacts: () => Promise<void>;
  /** Reload company row without full-page skeleton */
  reload: () => Promise<void>;
}

export function useCompanyDetail(id: string): UseCompanyDetailReturn {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsSortBy, setContactsSortByState] = useState("newest");
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);

  const fetchCompanyInitial = useCallback(async () => {
    setError(null);
    const stashedEarly = readStashedCompanyRow(id);
    if (stashedEarly) {
      setCompany(stashedEarly);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const c = await companiesService.get(id, {
        showToastOnError: false,
        notFoundReturnsNull: true,
      });
      if (c) {
        setCompany(c);
        return;
      }
      const stashed = readStashedCompanyRow(id) ?? stashedEarly;
      if (stashed) {
        setCompany(stashed);
        setError(null);
        return;
      }
      setCompany(null);
      setError(`Company with identifier '${id}' not found`);
    } catch (e) {
      const stashed = readStashedCompanyRow(id) ?? stashedEarly;
      if (stashed) {
        setCompany(stashed);
        setError(null);
        return;
      }
      const errMsg = e instanceof Error ? e.message : "Failed to load company";
      setError(errMsg);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchCompanyInitial();
    setContactsPage(1);
  }, [fetchCompanyInitial]);

  const reload = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const c = await companiesService.get(id, {
        showToastOnError: false,
        notFoundReturnsNull: true,
      });
      if (c) {
        setCompany(c);
        return;
      }
      const stashed = readStashedCompanyRow(id);
      if (stashed) {
        setCompany(stashed);
        return;
      }
      setCompany(null);
      setError(`Company with identifier '${id}' not found`);
    } catch (e) {
      const stashed = readStashedCompanyRow(id);
      if (stashed) {
        setCompany(stashed);
        return;
      }
      const errMsg = e instanceof Error ? e.message : "Failed to load company";
      setError(errMsg);
      setCompany(null);
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  const loadContacts = useCallback(async () => {
    if (!id) return;
    setContactsLoading(true);
    setContactsError(null);
    try {
      const offset = (contactsPage - 1) * CONTACTS_PAGE_SIZE;
      const sortKey = isContactListSortBy(contactsSortBy)
        ? contactsSortBy
        : "newest";
      const conn = await companiesService.companyContacts(
        id,
        {
          limit: CONTACTS_PAGE_SIZE,
          offset,
          query: {
            orderBy: contactListOrderByFromSortBy(sortKey),
          },
        },
        { showToastOnError: false, notFoundReturnsNull: false },
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
              runId: "post-fix-3",
              hypothesisId: "H-contacts-fe",
              location: "useCompanyDetail.ts:loadContacts",
              message: "company contacts loaded",
              data: { companyId: id, total: conn.total },
              timestamp: Date.now(),
            }),
          },
        )
        .catch(() => { });
      // #endregion
      setContactsTotal(conn.total);
      setContacts(conn.items.map(mapCompanyContactRow));
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to load company contacts";
      setContactsError(msg);
      setContactsTotal(0);
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }, [id, contactsPage, contactsSortBy]);

  const setContactsSortBy = useCallback((sort: string) => {
    setContactsSortByState(sort);
    setContactsPage(1);
  }, []);

  useEffect(() => {
    if (company) void loadContacts();
  }, [company, loadContacts]);

  return {
    company,
    loading,
    error,
    refreshing,
    contacts,
    contactsTotal,
    contactsPage,
    contactsSortBy,
    setContactsSortBy,
    contactsLoading,
    contactsError,
    setContactsPage,
    loadContacts,
    reload,
  };
}

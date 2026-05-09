"use client";

import { useState, useEffect, useCallback } from "react";
import {
  companiesService,
  mapCompanyContactRow,
  type Company,
} from "@/services/graphql/companiesService";
import type { Contact } from "@/services/graphql/contactsService";

const CONTACTS_PAGE_SIZE = 20;

export interface UseCompanyDetailReturn {
  company: Company | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  contacts: Contact[];
  contactsTotal: number;
  contactsPage: number;
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
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);

  const fetchCompanyInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await companiesService.get(id);
      setCompany(c);
    } catch (e) {
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
      const c = await companiesService.get(id);
      setCompany(c);
    } catch (e) {
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
      const conn = await companiesService.companyContacts(id, {
        limit: CONTACTS_PAGE_SIZE,
        offset,
        query: {},
      });
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
  }, [id, contactsPage]);

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
    contactsLoading,
    contactsError,
    setContactsPage,
    loadContacts,
    reload,
  };
}

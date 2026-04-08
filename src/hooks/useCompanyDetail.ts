"use client";

import { useState, useEffect, useCallback } from "react";
import {
  companiesService,
  mapCompanyContactRow,
  type Company,
} from "@/services/graphql/companiesService";

const CONTACTS_PAGE_SIZE = 20;

export interface CompanyContactRow {
  uuid: string;
  name: string;
  email?: string | null;
  title?: string | null;
  createdAt?: string | null;
}

export interface UseCompanyDetailReturn {
  company: Company | null;
  loading: boolean;
  error: string | null;
  contacts: ReturnType<typeof mapCompanyContactRow>[];
  contactsTotal: number;
  contactsPage: number;
  contactsLoading: boolean;
  setContactsPage: (page: number) => void;
  loadContacts: () => Promise<void>;
  reload: () => void;
}

export function useCompanyDetail(id: string): UseCompanyDetailReturn {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<
    ReturnType<typeof mapCompanyContactRow>[]
  >([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsLoading, setContactsLoading] = useState(false);

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await companiesService.get(id);
      setCompany(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load company");
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchCompany();
    setContactsPage(1);
  }, [fetchCompany]);

  const loadContacts = useCallback(async () => {
    if (!id) return;
    setContactsLoading(true);
    try {
      const offset = (contactsPage - 1) * CONTACTS_PAGE_SIZE;
      const conn = await companiesService.companyContacts(id, {
        limit: CONTACTS_PAGE_SIZE,
        offset,
        query: {},
      });
      setContactsTotal(conn.total);
      setContacts(conn.items.map(mapCompanyContactRow));
    } catch {
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
    contacts,
    contactsTotal,
    contactsPage,
    contactsLoading,
    setContactsPage,
    loadContacts,
    reload: () => void fetchCompany(),
  };
}

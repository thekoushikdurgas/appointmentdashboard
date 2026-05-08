/**
 * Client-side cache for contacts list responses to cut repeat GraphQL/Connectra traffic.
 * TTL 10 minutes; stale entries are dropped on read and via prune.
 */

import type { VqlQueryInput } from "@/graphql/generated/types";
import type { Contact } from "@/services/graphql/contactsService";

export const CONTACTS_LIST_CACHE_TTL_MS = 10 * 60 * 1000;

const STORAGE_PREFIX = "c360:contacts:list:v1:";
const SORT_PREF_KEY = "c360:contacts:sortBy:v1";
const PAGE_SIZE_PREF_KEY = "c360:contacts:pageSize:v1";
const DEFAULT_CONTACTS_PAGE_SIZE = 25;
const MIN_CONTACTS_PAGE = 10;
const MAX_CONTACTS_PAGE = 100;

export type ContactsListCachedPayload = {
  items: Contact[];
  total: number;
  savedAt: number;
};

function fingerprint(
  vql: Partial<VqlQueryInput>,
  page: number,
  pageSize: number,
): string {
  return JSON.stringify({ vql, page, pageSize });
}

export function contactsListCacheKey(
  vqlQuery: Partial<VqlQueryInput>,
  page: number,
  pageSize: number,
): string {
  return STORAGE_PREFIX + fingerprint(vqlQuery, page, pageSize);
}

export function readContactsListCache(
  key: string,
  ttlMs: number = CONTACTS_LIST_CACHE_TTL_MS,
): ContactsListCachedPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ContactsListCachedPayload;
    if (
      !parsed ||
      typeof parsed.savedAt !== "number" ||
      !Array.isArray(parsed.items) ||
      typeof parsed.total !== "number"
    ) {
      localStorage.removeItem(key);
      return null;
    }
    if (Date.now() - parsed.savedAt > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function writeContactsListCache(
  key: string,
  items: Contact[],
  total: number,
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: ContactsListCachedPayload = {
      items,
      total,
      savedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

/** Remove expired list entries under our prefix (keeps localStorage bounded). */
export function pruneExpiredContactsListCaches(
  ttlMs: number = CONTACTS_LIST_CACHE_TTL_MS,
): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
  }
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { savedAt?: number };
      if (typeof parsed.savedAt !== "number" || now - parsed.savedAt > ttlMs) {
        localStorage.removeItem(k);
      }
    } catch {
      localStorage.removeItem(k);
    }
  }
}

/** Invalidate all cached list pages (e.g. after import or forced refresh). */
export function clearAllContactsListCaches(): void {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
  }
  for (const k of keys) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

export function readContactsSortPreference(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SORT_PREF_KEY);
  } catch {
    return null;
  }
}

export function writeContactsSortPreference(sortBy: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SORT_PREF_KEY, sortBy);
  } catch {
    /* ignore */
  }
}

export function readContactsPageSizePreference(): number {
  if (typeof window === "undefined") return DEFAULT_CONTACTS_PAGE_SIZE;
  try {
    const raw = localStorage.getItem(PAGE_SIZE_PREF_KEY);
    if (!raw) return DEFAULT_CONTACTS_PAGE_SIZE;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return DEFAULT_CONTACTS_PAGE_SIZE;
    return Math.min(MAX_CONTACTS_PAGE, Math.max(MIN_CONTACTS_PAGE, n));
  } catch {
    return DEFAULT_CONTACTS_PAGE_SIZE;
  }
}

export function writeContactsPageSizePreference(n: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAGE_SIZE_PREF_KEY, String(n));
  } catch {
    /* ignore */
  }
}

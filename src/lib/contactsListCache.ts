/**
 * Client-side cache for contacts list responses to cut repeat GraphQL/Connectra traffic.
 * TTL 10 minutes; stale entries are dropped on read and via prune.
 */

import type { VqlQueryInput } from "@/graphql/generated/types";
import type { Contact } from "@/services/graphql/contactsService";
import {
  listLocalStorageKeysWithPrefix,
  tryLocalStorageGet,
  tryLocalStorageRemove,
  tryLocalStorageSet,
  tryLocalStorageSetJSON,
} from "@/lib/safeLocalStorage";

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
  const raw = tryLocalStorageGet(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ContactsListCachedPayload;
    if (
      !parsed ||
      typeof parsed.savedAt !== "number" ||
      !Array.isArray(parsed.items) ||
      typeof parsed.total !== "number"
    ) {
      tryLocalStorageRemove(key);
      return null;
    }
    if (Date.now() - parsed.savedAt > ttlMs) {
      tryLocalStorageRemove(key);
      return null;
    }
    return parsed;
  } catch {
    tryLocalStorageRemove(key);
    return null;
  }
}

export function writeContactsListCache(
  key: string,
  items: Contact[],
  total: number,
): void {
  const payload: ContactsListCachedPayload = {
    items,
    total,
    savedAt: Date.now(),
  };
  tryLocalStorageSetJSON(key, payload);
}

/** Remove expired list entries under our prefix (keeps localStorage bounded). */
export function pruneExpiredContactsListCaches(
  ttlMs: number = CONTACTS_LIST_CACHE_TTL_MS,
): void {
  const now = Date.now();
  const keys = listLocalStorageKeysWithPrefix(STORAGE_PREFIX);
  for (const k of keys) {
    try {
      const raw = tryLocalStorageGet(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { savedAt?: number };
      if (typeof parsed.savedAt !== "number" || now - parsed.savedAt > ttlMs) {
        tryLocalStorageRemove(k);
      }
    } catch {
      tryLocalStorageRemove(k);
    }
  }
}

/** Invalidate all cached list pages (e.g. after import or forced refresh). */
export function clearAllContactsListCaches(): void {
  const keys = listLocalStorageKeysWithPrefix(STORAGE_PREFIX);
  for (const k of keys) {
    tryLocalStorageRemove(k);
  }
}

export function readContactsSortPreference(): string | null {
  return tryLocalStorageGet(SORT_PREF_KEY);
}

export function writeContactsSortPreference(sortBy: string): void {
  tryLocalStorageSet(SORT_PREF_KEY, sortBy);
}

export function readContactsPageSizePreference(): number {
  const raw = tryLocalStorageGet(PAGE_SIZE_PREF_KEY);
  if (!raw) return DEFAULT_CONTACTS_PAGE_SIZE;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return DEFAULT_CONTACTS_PAGE_SIZE;
  return Math.min(MAX_CONTACTS_PAGE, Math.max(MIN_CONTACTS_PAGE, n));
}

export function writeContactsPageSizePreference(n: number): void {
  tryLocalStorageSet(PAGE_SIZE_PREF_KEY, String(n));
}

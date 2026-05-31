/**
 * Client-side cache for companies list responses (parity with contacts list cache).
 */

import type { VqlQueryInput } from "@/graphql/generated/types";
import type { Company } from "@/services/graphql/companiesService";
import {
  tryLocalStorageGet,
  tryLocalStorageRemove,
  tryLocalStorageSetJSON,
} from "@/lib/safeLocalStorage";

export const COMPANIES_LIST_CACHE_TTL_MS = 10 * 60 * 1000;

const STORAGE_PREFIX = "c360:companies:list:v1:";

export type CompaniesListCachedPayload = {
  items: Company[];
  total: number;
  savedAt: number;
};

function fingerprint(
  vql: Partial<VqlQueryInput>,
  page: number,
  pageSize: number,
  sortBy: string,
  search: string,
): string {
  return JSON.stringify({ vql, page, pageSize, sortBy, search });
}

export function companiesListCacheKey(
  vqlQuery: Partial<VqlQueryInput>,
  page: number,
  pageSize: number,
  sortBy: string,
  search: string,
): string {
  return STORAGE_PREFIX + fingerprint(vqlQuery, page, pageSize, sortBy, search);
}

export function readCompaniesListCache(
  key: string,
  ttlMs: number = COMPANIES_LIST_CACHE_TTL_MS,
): CompaniesListCachedPayload | null {
  const raw = tryLocalStorageGet(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CompaniesListCachedPayload;
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

export function writeCompaniesListCache(
  key: string,
  items: Company[],
  total: number,
): void {
  const payload: CompaniesListCachedPayload = {
    items,
    total,
    savedAt: Date.now(),
  };
  tryLocalStorageSetJSON(key, payload);
}

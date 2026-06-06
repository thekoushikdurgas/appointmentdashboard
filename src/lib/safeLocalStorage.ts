/**
 * Safe localStorage access for browser-only persistence.
 * Write/remove failures (quota, private mode, SSR) are swallowed intentionally.
 */

export function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function tryLocalStorageGet(key: string): string | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

const CACHE_EVICTION_PREFIXES = [
  "gql_cache:",
  "c360:contacts:list:",
  "c360:companies:list:",
  "c360:jobsList:",
  "c360:s3Files:",
] as const;

function isQuotaExceededError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "QuotaExceededError") ||
    (error instanceof Error && error.name === "QuotaExceededError")
  );
}

/** Drop large list/job/graphql caches so small prefs (e.g. filter pin) can still persist. */
export function evictLocalStorageCaches(): void {
  for (const prefix of CACHE_EVICTION_PREFIXES) {
    for (const k of listLocalStorageKeysWithPrefix(prefix)) {
      tryLocalStorageRemove(k);
    }
  }
}

export function tryLocalStorageSet(key: string, value: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    if (!isQuotaExceededError(error)) return;
    evictLocalStorageCaches();
    try {
      localStorage.setItem(key, value);
    } catch {
      // Still full after eviction, private mode, or disabled storage
    }
  }
}

export function tryLocalStorageRemove(key: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // QuotaExceededError, private mode, or disabled storage
  }
}

export function tryLocalStorageSetJSON(key: string, value: unknown): void {
  try {
    tryLocalStorageSet(key, JSON.stringify(value));
  } catch {
    // Serialization failure
  }
}

/** Keys under `prefix` (localStorage iteration). */
export function listLocalStorageKeysWithPrefix(prefix: string): string[] {
  if (!isLocalStorageAvailable()) return [];
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) keys.push(k);
    }
  } catch {
    return [];
  }
  return keys;
}

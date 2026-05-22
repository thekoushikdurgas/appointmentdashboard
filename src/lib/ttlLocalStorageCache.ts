/**
 * Generic localStorage TTL cache utility.
 *
 * Stores serialized JSON entries with an expiry timestamp.
 * All operations are synchronous and safe to call during SSR
 * (returns null / no-ops when localStorage is unavailable).
 */

import {
  isLocalStorageAvailable,
  listLocalStorageKeysWithPrefix,
  tryLocalStorageGet,
  tryLocalStorageRemove,
  tryLocalStorageSet,
} from "@/lib/safeLocalStorage";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Read a value from the TTL cache.
 * Returns `null` when the key doesn't exist or the entry has expired.
 */
export function readTTLCache<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) return null;
  const raw = tryLocalStorageGet(key);
  if (!raw) return null;
  try {
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      tryLocalStorageRemove(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Write a value to the TTL cache.
 * Silently ignores write failures (e.g. QuotaExceededError).
 */
export function writeTTLCache<T>(key: string, data: T, ttlMs: number): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
    tryLocalStorageSet(key, JSON.stringify(entry));
  } catch {
    // Serialization failure
  }
}

/**
 * Remove an entry from the TTL cache immediately (e.g. on logout or mutation).
 */
export function clearTTLCache(key: string): void {
  tryLocalStorageRemove(key);
}

/**
 * Remove all TTL cache entries whose keys start with `prefix`.
 */
export function clearTTLCacheByPrefix(prefix: string): void {
  if (!isLocalStorageAvailable()) return;
  const keysToDelete = listLocalStorageKeysWithPrefix(prefix);
  keysToDelete.forEach((k) => tryLocalStorageRemove(k));
}

/**
 * Generic localStorage TTL cache utility.
 *
 * Stores serialized JSON entries with an expiry timestamp.
 * All operations are synchronous and safe to call during SSR
 * (returns null / no-ops when localStorage is unavailable).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

/**
 * Read a value from the TTL cache.
 * Returns `null` when the key doesn't exist or the entry has expired.
 */
export function readTTLCache<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key);
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
 *
 * @param key        localStorage key
 * @param data       value to cache
 * @param ttlMs      time-to-live in milliseconds
 */
export function writeTTLCache<T>(key: string, data: T, ttlMs: number): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Ignore storage quota or serialization errors
  }
}

/**
 * Remove an entry from the TTL cache immediately (e.g. on logout or mutation).
 */
export function clearTTLCache(key: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

/**
 * Remove all TTL cache entries whose keys start with `prefix`.
 * Useful for clearing a logical group (e.g. "c360:billing:*").
 */
export function clearTTLCacheByPrefix(prefix: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) keysToDelete.push(key);
    }
    keysToDelete.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore
  }
}

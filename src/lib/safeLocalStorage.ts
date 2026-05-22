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

export function tryLocalStorageSet(key: string, value: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // QuotaExceededError, private mode, or disabled storage
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

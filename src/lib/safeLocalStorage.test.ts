/// <reference types="vitest/globals" />
import {
  evictLocalStorageCaches,
  tryLocalStorageGet,
  tryLocalStorageSet,
} from "./safeLocalStorage";

describe("tryLocalStorageSet quota recovery", () => {
  const store = new Map<string, string>();
  let setAttempts = 0;

  beforeEach(() => {
    store.clear();
    setAttempts = 0;
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      get length() {
        return store.size;
      },
      key: (i: number) => [...store.keys()][i] ?? null,
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        setAttempts += 1;
        if (setAttempts === 1) {
          throw new DOMException("quota", "QuotaExceededError");
        }
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("evicts large caches then retries the write", () => {
    store.set("gql_cache:old", '{"data":1}');
    store.set("c360:contacts:list:v1:abc", '{"items":[]}');
    tryLocalStorageSet(
      "c360-data-filters-peek-pinned-companies",
      '{"pinned":true}',
    );
    expect(tryLocalStorageGet("gql_cache:old")).toBeNull();
    expect(tryLocalStorageGet("c360-data-filters-peek-pinned-companies")).toBe(
      '{"pinned":true}',
    );
  });

  it("evictLocalStorageCaches removes known cache prefixes only", () => {
    store.set("gql_cache:x", "1");
    store.set("c360:theme", "dark");
    evictLocalStorageCaches();
    expect(store.has("gql_cache:x")).toBe(false);
    expect(store.get("c360:theme")).toBe("dark");
  });
});

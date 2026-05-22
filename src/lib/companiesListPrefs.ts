import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safeLocalStorage";

const PAGE_SIZE_KEY = "c360:companies:pageSize:v1";
const DEFAULT_PAGE_SIZE = 25;
const MIN = 10;
const MAX = 100;

export function readCompaniesPageSizePreference(): number {
  const raw = tryLocalStorageGet(PAGE_SIZE_KEY);
  if (!raw) return DEFAULT_PAGE_SIZE;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX, Math.max(MIN, n));
}

export function writeCompaniesPageSizePreference(n: number): void {
  tryLocalStorageSet(PAGE_SIZE_KEY, String(n));
}

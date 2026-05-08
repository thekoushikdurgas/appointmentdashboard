const PAGE_SIZE_KEY = "c360:companies:pageSize:v1";
const DEFAULT_PAGE_SIZE = 25;
const MIN = 10;
const MAX = 100;

export function readCompaniesPageSizePreference(): number {
  if (typeof window === "undefined") return DEFAULT_PAGE_SIZE;
  try {
    const raw = localStorage.getItem(PAGE_SIZE_KEY);
    if (!raw) return DEFAULT_PAGE_SIZE;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return DEFAULT_PAGE_SIZE;
    return Math.min(MAX, Math.max(MIN, n));
  } catch {
    return DEFAULT_PAGE_SIZE;
  }
}

export function writeCompaniesPageSizePreference(n: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAGE_SIZE_KEY, String(n));
  } catch {
    /* ignore */
  }
}

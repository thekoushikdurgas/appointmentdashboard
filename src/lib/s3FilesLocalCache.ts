/**
 * Persists last successful S3 file list per list prefix so the Files page can
 * paint immediately on return visits; refreshed after each API list and local mutations.
 */

import type { S3FileInfo } from "@/graphql/generated/types";

const CACHE_VERSION = 1 as const;
const KEY_PREFIX = "c360:s3Files:v1:";
/** ~4MB guard — skip write if payload would exceed typical localStorage quota. */
const MAX_JSON_CHARS = 4_000_000;

export interface S3FilesListCachePayload {
  v: typeof CACHE_VERSION;
  savedAt: number;
  prefix: string;
  bucketDisplayName: string | null;
  total: number;
  files: S3FileInfo[];
}

function normalizePrefixKey(prefix?: string): string {
  return prefix ?? "";
}

export function s3FilesCacheStorageKey(prefix?: string): string {
  return `${KEY_PREFIX}${normalizePrefixKey(prefix)}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readS3FilesCache(
  prefix?: string,
): S3FilesListCachePayload | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(s3FilesCacheStorageKey(prefix));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if (o.v !== CACHE_VERSION || !Array.isArray(o.files)) return null;
    return {
      v: CACHE_VERSION,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : 0,
      prefix:
        typeof o.prefix === "string" ? o.prefix : normalizePrefixKey(prefix),
      bucketDisplayName:
        o.bucketDisplayName === null || typeof o.bucketDisplayName === "string"
          ? (o.bucketDisplayName as string | null)
          : null,
      total: typeof o.total === "number" ? o.total : o.files.length,
      files: o.files as S3FileInfo[],
    };
  } catch {
    return null;
  }
}

export function writeS3FilesCache(
  prefix: string | undefined,
  data: {
    bucketDisplayName: string | null;
    total: number;
    files: S3FileInfo[];
  },
): void {
  if (!isBrowser()) return;
  const full: S3FilesListCachePayload = {
    v: CACHE_VERSION,
    savedAt: Date.now(),
    prefix: normalizePrefixKey(prefix),
    bucketDisplayName: data.bucketDisplayName,
    total: data.total,
    files: data.files,
  };
  try {
    const json = JSON.stringify(full);
    if (json.length > MAX_JSON_CHARS) return;
    localStorage.setItem(s3FilesCacheStorageKey(prefix), json);
  } catch {
    /* quota or private mode */
  }
}

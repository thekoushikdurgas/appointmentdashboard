import type { VqlQueryInput } from "@/graphql/generated/types";

export const SAVED_SEARCH_VERSION = 1 as const;

/** Versioned payload stored in `CreateSavedSearchInput.filters` (JSON) for contact lists. */
export type ContactSavedSearchPayload = {
  version: typeof SAVED_SEARCH_VERSION;
  vqlQuery: Partial<VqlQueryInput>;
  pageSize: number;
};

/** Versioned payload for company list saved searches. */
export type CompanySavedSearchPayload = {
  version: typeof SAVED_SEARCH_VERSION;
  vqlQuery: Partial<VqlQueryInput>;
  search: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isVqlQueryObject(v: unknown): boolean {
  return (
    typeof v === "object" && v !== null && !Array.isArray(v)
  );
}

export function isContactSavedSearchPayload(
  v: unknown,
): v is ContactSavedSearchPayload {
  if (!isRecord(v)) return false;
  return (
    v.version === SAVED_SEARCH_VERSION &&
    isVqlQueryObject(v.vqlQuery) &&
    typeof v.pageSize === "number"
  );
}

export function isCompanySavedSearchPayload(
  v: unknown,
): v is CompanySavedSearchPayload {
  if (!isRecord(v)) return false;
  return (
    v.version === SAVED_SEARCH_VERSION &&
    isVqlQueryObject(v.vqlQuery) &&
    typeof v.search === "string"
  );
}

export function parseSavedSearchFilters(
  filters: unknown,
): ContactSavedSearchPayload | CompanySavedSearchPayload | null {
  if (!isRecord(filters)) return null;
  if (isContactSavedSearchPayload(filters)) return filters;
  if (isCompanySavedSearchPayload(filters)) return filters;
  return null;
}

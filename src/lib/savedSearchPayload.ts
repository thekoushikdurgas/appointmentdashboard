import type { VqlQueryInput } from "@/graphql/generated/types";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";
import type { DraftQuery } from "@/lib/vqlDraft";

/** Original contact saved-search shape (VQL only). */
export const SAVED_SEARCH_VERSION = 1 as const;

/** Contact / company payloads that include full sidebar state for correct apply + UI sync. */
export const SAVED_SEARCH_VERSION_SIDEBAR = 2 as const;

export type ContactSavedSearchPayloadV1 = {
  version: typeof SAVED_SEARCH_VERSION;
  vqlQuery: Partial<VqlQueryInput>;
  pageSize: number;
};

export type ContactSavedSearchPayloadV2 = {
  version: typeof SAVED_SEARCH_VERSION_SIDEBAR;
  vqlQuery: Partial<VqlQueryInput>;
  pageSize: number;
  search: string;
  statusFilter: string;
  sortBy: string;
  activeTab: string;
  facetValues: Record<string, string[]>;
  advancedListDraft: DraftQuery | null;
};

export type ContactSavedSearchPayload =
  | ContactSavedSearchPayloadV1
  | ContactSavedSearchPayloadV2;

export type CompanySavedSearchPayloadV1 = {
  version: typeof SAVED_SEARCH_VERSION;
  vqlQuery: Partial<VqlQueryInput>;
  search: string;
};

export type CompanySavedSearchPayloadV2 = {
  version: typeof SAVED_SEARCH_VERSION_SIDEBAR;
  vqlQuery: Partial<VqlQueryInput>;
  search: string;
  facetValues: Record<string, string>;
  advancedCompanyDraft: DraftQuery | null;
};

export type CompanySavedSearchPayload =
  | CompanySavedSearchPayloadV1
  | CompanySavedSearchPayloadV2;

export const HIRE_SIGNAL_SAVED_SEARCH_VERSION = 1 as const;

export type HireSignalSavedSearchPayload = {
  version: typeof HIRE_SIGNAL_SAVED_SEARCH_VERSION;
  listFilters: JobListFilters;
  signalTimePreset: "all" | "new_7d";
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isVqlQueryObject(v: unknown): boolean {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isDraftQueryLike(v: unknown): v is DraftQuery {
  if (!isRecord(v)) return false;
  return (
    isRecord(v.rootGroup) &&
    Array.isArray(v.sort) &&
    Array.isArray(v.selectColumns) &&
    typeof v.companyPopulate === "boolean" &&
    Array.isArray(v.companySelectColumns)
  );
}

export function isContactSavedSearchPayload(
  v: unknown,
): v is ContactSavedSearchPayload {
  if (!isRecord(v)) return false;
  if (v.version === SAVED_SEARCH_VERSION_SIDEBAR) {
    return (
      isVqlQueryObject(v.vqlQuery) &&
      typeof v.pageSize === "number" &&
      typeof v.search === "string" &&
      typeof v.statusFilter === "string" &&
      typeof v.sortBy === "string" &&
      typeof v.activeTab === "string" &&
      typeof v.facetValues === "object" &&
      v.facetValues !== null &&
      !Array.isArray(v.facetValues) &&
      (v.advancedListDraft === null || isDraftQueryLike(v.advancedListDraft))
    );
  }
  if (v.version === SAVED_SEARCH_VERSION) {
    return isVqlQueryObject(v.vqlQuery) && typeof v.pageSize === "number";
  }
  return false;
}

export function isCompanySavedSearchPayload(
  v: unknown,
): v is CompanySavedSearchPayload {
  if (!isRecord(v)) return false;
  if (v.version === SAVED_SEARCH_VERSION_SIDEBAR) {
    return (
      isVqlQueryObject(v.vqlQuery) &&
      typeof v.search === "string" &&
      typeof v.facetValues === "object" &&
      v.facetValues !== null &&
      !Array.isArray(v.facetValues) &&
      (v.advancedCompanyDraft === null ||
        isDraftQueryLike(v.advancedCompanyDraft))
    );
  }
  if (v.version === SAVED_SEARCH_VERSION) {
    return isVqlQueryObject(v.vqlQuery) && typeof v.search === "string";
  }
  return false;
}

export function isHireSignalSavedSearchPayload(
  v: unknown,
): v is HireSignalSavedSearchPayload {
  if (!isRecord(v)) return false;
  if (v.version !== HIRE_SIGNAL_SAVED_SEARCH_VERSION) return false;
  if (!isRecord(v.listFilters)) return false;
  const lf = v.listFilters;
  if (typeof lf.limit !== "number" || typeof lf.offset !== "number")
    return false;
  const preset = v.signalTimePreset;
  return preset === "all" || preset === "new_7d";
}

export function parseSavedSearchFilters(
  filters: unknown,
): ContactSavedSearchPayload | CompanySavedSearchPayload | null {
  if (!isRecord(filters)) return null;
  if (isContactSavedSearchPayload(filters)) return filters;
  if (isCompanySavedSearchPayload(filters)) return filters;
  return null;
}

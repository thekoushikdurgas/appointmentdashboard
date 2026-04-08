/**
 * API module types — full re-export from codegen plus small legacy aliases.
 * Prefer `@/graphql/generated/types` in new code; use this file for deprecated names only.
 */

export type * from "@/graphql/generated/types";

import type {
  VqlConditionInput,
  VqlOrderByInput,
  VqlFilterInput,
  VqlQueryInput,
  ApiKey,
  ApiKeyList,
  S3Health,
  PageList,
  Verify2FaResponse,
} from "@/graphql/generated/types";

/** Paginated connection helper (pattern used across hooks). */
export interface Connection<T> {
  items: T[];
  pageInfo: import("@/graphql/generated/types").PageInfo;
}

/** @deprecated Use `VqlConditionInput` from `generated/types`. */
export type VQLConditionInput = VqlConditionInput;
/** @deprecated Use `VqlOrderByInput` from `generated/types`. */
export type VQLOrderByInput = VqlOrderByInput;
/** @deprecated Use `VqlFilterInput` from `generated/types`. */
export type VQLFilterInput = VqlFilterInput;
/** @deprecated Use `VqlQueryInput` from `generated/types`. */
export type VQLQueryInput = VqlQueryInput;

/** @deprecated Use `ApiKey` from `generated/types`. */
export type APIKey = ApiKey;
/** @deprecated Use `ApiKeyList` from `generated/types`. */
export type APIKeyList = ApiKeyList;

/** @deprecated Use `S3Health` from `generated/types`. */
export type S3HealthInfo = S3Health;

/** Historical spelling — schema exports `Verify2FaResponse`. */
export type Verify2FAResponse = Verify2FaResponse;

export type DashboardPageList = PageList;

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

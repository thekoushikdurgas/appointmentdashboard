/**
 * errorParser — unified operation error shape for all UI domains.
 *
 * Converts any thrown error (GraphQL, Email, Storage, LinkedIn, generic) into
 * a typed `OperationError` so every page can render consistent error UI
 * without ad-hoc string manipulation.
 */

import { parseGraphQLError, type GraphQLErrorResponse } from "./graphqlClient";
import { parseEmailServiceError } from "./emailErrors";
import { getStorageErrorMessage } from "./storageErrors";

export interface OperationError {
  /** Human-readable message safe to show in the UI */
  userMessage: string;
  /** True if the user can retry the same action */
  retryable: boolean;
  /** ERR_* code from Connectra / backend extensions */
  code?: string;
  /** HTTP status from GraphQL extensions.httpStatus */
  httpStatus?: number;
  /** Field-level validation errors keyed by field name */
  fieldErrors?: Record<string, string[]>;
  /** Resource was not found (404 / NOT_FOUND) */
  isNotFound: boolean;
  /** Input validation failed (400 / 422) */
  isValidation: boolean;
  /** User lacks permission (403) */
  isPermission: boolean;
  /** Downstream service is unavailable (5xx / SERVICE_UNAVAILABLE) */
  isServiceDown: boolean;
}

type Domain = "contacts" | "companies" | "jobs" | "linkedin" | "email" | "storage";

type ErrWithParsed = Error & {
  parsedError?: ReturnType<typeof parseGraphQLError>;
  response?: { errors?: GraphQLErrorResponse[] };
};

/** Extract a friendly user message from an arbitrary thrown value. */
function extractMessage(err: unknown, domain: Domain): string {
  if (domain === "email") return parseEmailServiceError(err);
  if (domain === "storage") return getStorageErrorMessage(err);

  if (err && typeof err === "object") {
    const e = err as ErrWithParsed;
    if (e.parsedError?.message) return e.parsedError.message;
    if (e.response?.errors?.[0]?.message) return e.response.errors[0].message;
  }
  if (err instanceof Error && err.message) return err.message;
  return "An unexpected error occurred. Please try again.";
}

/**
 * Convert any error thrown during a GraphQL / REST call into a structured
 * `OperationError` that UI components can branch on without string matching.
 */
export function parseOperationError(err: unknown, domain: Domain): OperationError {
  // Attempt to extract GraphQL error metadata
  let parsedGraphQL: ReturnType<typeof parseGraphQLError> | undefined;

  if (err && typeof err === "object") {
    const e = err as ErrWithParsed;
    if (e.parsedError) {
      parsedGraphQL = e.parsedError;
    } else if (e.response?.errors && e.response.errors.length > 0) {
      parsedGraphQL = parseGraphQLError(e.response.errors);
    }
  }

  const httpStatus =
    parsedGraphQL?.status ??
    ((err as Record<string, unknown>)?.extensions as Record<string, unknown> | undefined)
      ?.httpStatus as number | undefined;

  const code =
    parsedGraphQL?.code ??
    (((err as Record<string, unknown>)?.extensions as Record<string, unknown> | undefined)
      ?.errorCode as string | undefined);

  const fieldErrors = parsedGraphQL?.fieldErrors;

  const isNotFound =
    parsedGraphQL?.isNotFoundError ??
    httpStatus === 404 ??
    code === "ERR_JOB_NOT_FOUND" ??
    false;

  const isValidation =
    parsedGraphQL?.isValidationError ??
    httpStatus === 400 ??
    httpStatus === 422 ??
    !!(fieldErrors && Object.keys(fieldErrors).length > 0) ??
    (typeof code === "string" && (code.includes("INVALID") || code.includes("MISSING") || code.includes("VALIDATION"))) ??
    false;

  const isPermission = parsedGraphQL?.isPermissionError ?? httpStatus === 403 ?? false;

  const isServiceDown =
    (httpStatus !== undefined && httpStatus >= 500) ||
    code === "SERVICE_UNAVAILABLE" ||
    code === "RATE_LIMIT_EXCEEDED";

  const retryable = isServiceDown || (httpStatus !== undefined && httpStatus === 429);

  return {
    userMessage: extractMessage(err, domain),
    retryable,
    code,
    httpStatus,
    fieldErrors,
    isNotFound,
    isValidation,
    isPermission,
    isServiceDown,
  };
}

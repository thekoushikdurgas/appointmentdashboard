/**
 * Storage-specific error message utilities.
 *
 * Converts GraphQL / network errors from the s3storage layer into
 * human-readable strings suitable for UI display.
 */
import type { ParsedGraphQLError } from "@/lib/graphqlClient";

/**
 * Extract a user-friendly message from any error thrown by s3Service calls.
 *
 * The GraphQL client attaches a `parsedError` property to errors raised by
 * `graphqlRequest` when the server returns `errors` in the response body.
 * We use that structured data to produce actionable messages; otherwise we
 * fall back gracefully.
 */
export function getStorageErrorMessage(e: unknown): string {
  if (e != null && typeof e === "object") {
    const parsed = (e as Record<string, unknown>).parsedError as
      | ParsedGraphQLError
      | undefined;

    if (parsed) {
      if (parsed.isPermissionError) {
        return "Access denied. Check your account permissions.";
      }
      if (parsed.isNotFoundError) {
        return "File or resource not found.";
      }
      if (parsed.code === "SERVICE_UNAVAILABLE") {
        return "Storage service is temporarily unavailable. Please try again shortly.";
      }
      if (parsed.isValidationError) {
        return parsed.message || "Invalid request. Please check your input.";
      }
      if (parsed.message) {
        return parsed.message;
      }
    }
  }

  if (e instanceof Error) {
    return e.message || "An unexpected error occurred.";
  }

  return String(e) || "An unexpected error occurred.";
}

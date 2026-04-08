import type { ParsedGraphQLError } from "@/lib/graphqlClient";

type ErrWithParsed = Error & { parsedError?: ParsedGraphQLError };

/**
 * Human-readable message from GraphQL errors returned by email.* / jobs.* email satellite calls.
 * Prefer over raw `Error.message` when `graphqlRequest` attached `parsedError`.
 */
export function parseEmailServiceError(err: unknown): string {
  if (err && typeof err === "object" && "parsedError" in err) {
    const pe = (err as ErrWithParsed).parsedError;
    if (pe) {
      if (pe.status === 401) {
        return "Email service key misconfigured or unauthorized.";
      }
      if (pe.isNotFoundError) {
        return pe.detail || pe.message || "Not found.";
      }
      if (pe.status === 400 || pe.status === 422 || pe.isValidationError) {
        return pe.message;
      }
      return pe.message;
    }
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

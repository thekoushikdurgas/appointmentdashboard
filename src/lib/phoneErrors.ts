import type { ParsedGraphQLError } from "@/lib/graphqlClient";

type ErrWithParsed = Error & { parsedError?: ParsedGraphQLError };

/** Human-readable GraphQL errors from `phone.*` satellite calls. */
export function parsePhoneServiceError(err: unknown): string {
  if (err && typeof err === "object" && "parsedError" in err) {
    const pe = (err as ErrWithParsed).parsedError;
    if (pe) {
      if (pe.message.toLowerCase().includes("phone satellite")) {
        return pe.message;
      }
      if (pe.status === 401) {
        return "Phone service unauthorized — check gateway PHONE_SERVER_* configuration.";
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

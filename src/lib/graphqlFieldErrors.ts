import type { ParsedGraphQLError } from "@/lib/graphqlClient";

export function getGraphQLFieldErrors(
  err: unknown,
): Record<string, string[]> | undefined {
  if (!err || typeof err !== "object") return undefined;
  const parsed = (err as { parsedError?: ParsedGraphQLError }).parsedError;
  return parsed?.fieldErrors;
}

/** First message for a field, or undefined. */
export function firstFieldMessage(
  fieldErrors: Record<string, string[]> | undefined,
  field: string,
): string | undefined {
  const list = fieldErrors?.[field];
  return list?.[0];
}

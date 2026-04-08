/**
 * Map a raw GraphQL / HTTP error from the LinkedIn API namespace to a
 * user-friendly message. Falls back to the raw message if no rule matches.
 */
export function mapLinkedInError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Unknown error";

  const lower = raw.toLowerCase();

  if (
    lower.includes("validation_error") ||
    lower.includes("validation error")
  ) {
    if (lower.includes("url")) {
      return "Invalid LinkedIn URL. Make sure it starts with https://www.linkedin.com/ and points to a valid profile or company page.";
    }
    if (lower.includes("at least one")) {
      return "Please provide at least some contact or company data to import.";
    }
    return "Validation error — please check your inputs and try again.";
  }

  if (
    lower.includes("service_unavailable") ||
    lower.includes("service unavailable") ||
    lower.includes("connectra") ||
    lower.includes("upstream") ||
    lower.includes("502") ||
    lower.includes("503")
  ) {
    return "The LinkedIn data service is temporarily unavailable. Please try again in a few moments.";
  }

  if (lower.includes("rate") && lower.includes("limit")) {
    return "LinkedIn rate limit reached. Please wait a minute before searching again.";
  }

  if (lower.includes("not found") || lower.includes("no results")) {
    return "No LinkedIn data found for this URL. Try a different profile or company page.";
  }

  if (
    lower.includes("unauthorized") ||
    lower.includes("401") ||
    lower.includes("forbidden") ||
    lower.includes("403")
  ) {
    return "Access denied. Your plan may not include LinkedIn features — check your billing.";
  }

  if (lower.includes("credit") || lower.includes("insufficient")) {
    return "Insufficient credits for this operation. Please top up your credits in Billing.";
  }

  return raw;
}

/**
 * Map a raw GraphQL error from contacts/companies (Connectra backend) to a
 * friendly unavailability message for error states on list pages.
 */
export function mapConnectraError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Unknown error";

  const lower = raw.toLowerCase();

  if (
    lower.includes("connectra") ||
    lower.includes("service_unavailable") ||
    lower.includes("service unavailable") ||
    lower.includes("upstream") ||
    lower.includes("502") ||
    lower.includes("503")
  ) {
    return "The data service (Connectra) is currently unavailable. Contact data may be temporarily inaccessible. Please try again shortly.";
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "The request timed out. The data service may be under load — please try again.";
  }

  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network error — check your connection and try again.";
  }

  return raw;
}

/** Align with gateway LinkedIn URL rules: https prefix and reasonable length. */
const PREFIX = /^https?:\/\/(www\.)?linkedin\.com\//i;
const MAX_LEN = 2048;

export function validateLinkedInUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return "Enter a LinkedIn URL.";
  if (s.length > MAX_LEN) return `URL must be at most ${MAX_LEN} characters.`;
  if (!PREFIX.test(s))
    return "Use a LinkedIn URL starting with https://www.linkedin.com/";
  return null;
}

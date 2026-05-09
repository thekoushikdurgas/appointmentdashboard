import type { ContactFilterData } from "@/graphql/generated/types";

/**
 * Fallback facet options when Connectra metadata omits ``email_status`` (still uses index tokens).
 */
export const EMAIL_STATUS_STATIC_FACET_OPTIONS: ContactFilterData[] = [
  { value: "verified", displayValue: "Verified" },
  { value: "found", displayValue: "Found" },
  { value: "unknown", displayValue: "Unknown" },
  { value: "risky", displayValue: "Risky" },
];

/** Legacy pill labels from the old Email status UI → VQL keyword tokens. */
export const LEGACY_EMAIL_STATUS_PILL_TO_TOKEN: Record<string, string> = {
  Verified: "verified",
  Found: "found",
  Unknown: "unknown",
  Risky: "risky",
};

/**
 * Connectra / index keyword values use lowercase (e.g. ``verified``); some APIs still return
 * ``VALID``. Sidebar filters must send index tokens (see ``contacts/page.tsx`` STATUS_MAP).
 */
export function isContactEmailVerifiedStatus(status?: string | null): boolean {
  const u = (status || "").toUpperCase();
  return u === "VALID" || u === "VERIFIED";
}

/**
 * Maps verifier/UI legacy tokens (``VALID``) to Connectra keyword values (``verified``).
 * Python ``convert_keyword_match`` lowercases strings; ``VALID`` became ``valid`` and did not match indexed ``verified``.
 */
export function normalizeEmailStatusFilterToken(raw: string): string {
  const u = raw.trim().toUpperCase();
  switch (u) {
    case "VALID":
      return "verified";
    case "FOUND":
      return "found";
    case "UNKNOWN":
      return "unknown";
    case "RISKY":
      return "risky";
    default:
      return raw.trim();
  }
}

export function normalizeEmailStatusFilterValues(values: string[]): string[] {
  return values.map((v) => normalizeEmailStatusFilterToken(v));
}

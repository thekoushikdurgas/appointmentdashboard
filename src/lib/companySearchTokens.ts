import { normalizeHiringSignalTokenList } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";

/** Parse toolbar / sidebar search string into distinct tokens (comma/semicolon/newline). */
export function companySearchTokensFromString(search: string): string[] {
  const raw = search.trim();
  if (!raw) return [];
  const parts = raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return [raw];
  return normalizeHiringSignalTokenList(parts);
}

/** Serialize tokens for sidebar search input and saved searches. */
export function companySearchStringFromTokens(tokens: string[]): string {
  return normalizeHiringSignalTokenList(tokens).join(", ");
}

import type { Company } from "@/services/graphql/companiesService";

/** Drop duplicate company rows (same `id`) — keeps first occurrence. */
export function dedupeCompaniesById(items: Company[]): Company[] {
  const seen = new Set<string>();
  const out: Company[] = [];
  for (const c of items) {
    const id = c.id?.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(c);
  }
  return out;
}

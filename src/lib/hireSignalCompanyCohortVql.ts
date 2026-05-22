import type { HiringSignalFilterDraft } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";

/** Connectra company index facet keys exposed in hiring-signals company cohort UI. */
export const COMPANY_COHORT_FACET_KEYS = new Set([
  "country",
  "industries",
  "employees_count",
  "annual_revenue",
  "total_funding",
]);

export function buildCompanyFacetFilters(
  companyFacetValues: Record<string, string[]>,
): Record<string, string[]> | undefined {
  const out: Record<string, string[]> = {};
  for (const [key, vals] of Object.entries(companyFacetValues)) {
    if (!COMPANY_COHORT_FACET_KEYS.has(key)) continue;
    const trimmed = vals.map((v) => String(v).trim()).filter(Boolean);
    if (trimmed.length > 0) out[key] = trimmed;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function buildCompanyCohortRequest(draft: HiringSignalFilterDraft): {
  companyNameSearch: string | null;
  companyFacetFilters: Record<string, string[]> | null;
} {
  const name = draft.companyNameSearch.trim();
  const facets = buildCompanyFacetFilters(draft.companyFacetValues);
  return {
    companyNameSearch: name || null,
    companyFacetFilters: facets ?? null,
  };
}

export function isCompanyCohortActive(draft: HiringSignalFilterDraft): boolean {
  if (draft.companyNameSearch.trim()) return true;
  const facets = buildCompanyFacetFilters(draft.companyFacetValues);
  return facets != null && Object.keys(facets).length > 0;
}

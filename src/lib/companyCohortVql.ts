import type {
  VqlConditionInput,
  VqlFilterInput,
} from "@/graphql/generated/types";
import { buildCompanyListVql } from "@/lib/companyListVql";

/** Connectra company-index facet keys exposed on hiring-signals company filters. */
export const COMPANY_COHORT_FACET_KEYS = new Set([
  "name",
  "country",
  "industries",
  "annual_revenue",
  "employees_count",
  "total_funding",
]);

export const MAX_COMPANY_COHORT_UUIDS = 2000;

const COMPANY_COHORT_PAGE_SIZE = 500;

export function isCompanyCohortActive(
  nameSearch: string | undefined,
  facetValues: Record<string, string[]> | undefined,
): boolean {
  if ((nameSearch ?? "").trim()) return true;
  if (!facetValues) return false;
  for (const [key, vals] of Object.entries(facetValues)) {
    if (!COMPANY_COHORT_FACET_KEYS.has(key)) continue;
    if (vals.some((v) => String(v).trim())) return true;
  }
  return false;
}

export function buildCompanyCohortFacetFilter(
  facetValues: Record<string, string[]>,
): VqlFilterInput | undefined {
  const conditions: VqlConditionInput[] = [];
  for (const [key, vals] of Object.entries(facetValues)) {
    if (!COMPANY_COHORT_FACET_KEYS.has(key)) continue;
    const trimmed = vals.map((v) => String(v).trim()).filter(Boolean);
    if (trimmed.length === 0) continue;
    if (trimmed.length === 1) {
      conditions.push({
        field: key,
        operator: "eq",
        value: trimmed[0] as unknown as VqlConditionInput["value"],
      });
    } else {
      conditions.push({
        field: key,
        operator: "in",
        value: trimmed as unknown as VqlConditionInput["value"],
      });
    }
  }
  if (conditions.length === 0) return undefined;
  return { conditions };
}

export function buildCompanyCohortListQuery(
  nameSearch: string,
  facetValues: Record<string, string[]>,
  page: number,
): ReturnType<typeof buildCompanyListVql> {
  const facetFilter = buildCompanyCohortFacetFilter(facetValues);
  const extra = facetFilter ? { filters: facetFilter } : {};
  return buildCompanyListVql(
    page,
    COMPANY_COHORT_PAGE_SIZE,
    nameSearch,
    extra,
    { sortBy: "newest" },
  );
}

export { COMPANY_COHORT_PAGE_SIZE };

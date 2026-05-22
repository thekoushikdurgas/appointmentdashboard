import type { VqlConditionInput, VqlFilterInput } from "@/graphql/generated/types";
import type { HiringSignalFilterDraft } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";

/** Facet filter keys (Connectra company index) — excludes name (toolbar search uses VQL `name`). */
export const HIRE_SIGNAL_COMPANY_COHORT_FACET_KEYS = [
  "country",
  "industries",
  "annual_revenue",
  "employees_count",
  "total_funding",
] as const;

export type HireSignalCompanyCohortFacetKey =
  (typeof HIRE_SIGNAL_COMPANY_COHORT_FACET_KEYS)[number];

/** Sidebar order and labels (always shown). */
export const HIRE_SIGNAL_COMPANY_COHORT_SECTIONS: ReadonlyArray<{
  filterKey: HireSignalCompanyCohortFacetKey;
  title: string;
}> = [
  { filterKey: "country", title: "Country" },
  { filterKey: "industries", title: "Company industry" },
  { filterKey: "annual_revenue", title: "Revenue" },
  { filterKey: "employees_count", title: "Employee size" },
  { filterKey: "total_funding", title: "Funding" },
];

export const HIRE_SIGNAL_COMPANY_COHORT_KEYS = new Set<string>([
  ...HIRE_SIGNAL_COMPANY_COHORT_FACET_KEYS,
]);

export const HIRE_SIGNAL_COMPANY_COHORT_LABELS: Record<
  HireSignalCompanyCohortFacetKey,
  string
> = {
  country: "Country",
  industries: "Company industry",
  annual_revenue: "Revenue",
  employees_count: "Employee size",
  total_funding: "Funding",
};

export const HIRE_SIGNAL_COMPANY_COHORT_PAGE_SIZE = 500;
export const HIRE_SIGNAL_COMPANY_COHORT_UUID_CAP = 2000;

export function isCompanyCohortActive(draft: HiringSignalFilterDraft): boolean {
  if (draft.companyNameSearch.trim()) return true;
  for (const [key, vals] of Object.entries(draft.companyFacetValues)) {
    if (!HIRE_SIGNAL_COMPANY_COHORT_KEYS.has(key)) continue;
    if (vals.some((v) => String(v).trim())) return true;
  }
  return false;
}

/** Build Connectra `filters` from hiring-signals company cohort draft (facets only). */
export function companyFacetFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const conditions: VqlConditionInput[] = [];
  for (const [key, vals] of Object.entries(draft.companyFacetValues)) {
    if (!HIRE_SIGNAL_COMPANY_COHORT_KEYS.has(key)) continue;
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

import type {
  VqlConditionInput,
  VqlFilterInput,
} from "@/graphql/generated/types";
import type { HiringSignalFilterDraft } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import {
  companyEmployeeSizeTokensToVqlFilter,
  HIRE_SIGNAL_COMPANY_EMPLOYEE_SIZE_FIELD,
} from "@/lib/hireSignalCompanyEmployeeSizeBuckets";
import { companyFundingTokensToVqlFilter } from "@/lib/hireSignalCompanyFundingBuckets";

export { HIRE_SIGNAL_COMPANY_FUNDING_FIELD } from "@/lib/hireSignalCompanyFundingBuckets";

/** Facet filter keys (Connectra company index) — excludes name (toolbar search uses VQL `name`). */
export const HIRE_SIGNAL_COMPANY_COHORT_FACET_KEYS = ["annual_revenue"] as const;

/** Connectra company index field for country (dedicated include/exclude UI). */
export const HIRE_SIGNAL_COMPANY_COUNTRY_FIELD = "country" as const;

/** Connectra company index field for industry (dedicated include/exclude UI). */
export const HIRE_SIGNAL_COMPANY_INDUSTRY_FIELD = "industries" as const;

export type HireSignalCompanyCohortFacetKey =
  (typeof HIRE_SIGNAL_COMPANY_COHORT_FACET_KEYS)[number];

/** Sidebar order and labels (always shown). */
export const HIRE_SIGNAL_COMPANY_COHORT_SECTIONS: ReadonlyArray<{
  filterKey: HireSignalCompanyCohortFacetKey;
  title: string;
}> = [{ filterKey: "annual_revenue", title: "Revenue" }];

export const HIRE_SIGNAL_COMPANY_COHORT_KEYS = new Set<string>([
  ...HIRE_SIGNAL_COMPANY_COHORT_FACET_KEYS,
]);

export const HIRE_SIGNAL_COMPANY_COHORT_LABELS: Record<
  HireSignalCompanyCohortFacetKey,
  string
> = {
  annual_revenue: "Revenue",
};

export const HIRE_SIGNAL_COMPANY_COHORT_PAGE_SIZE = 500;
export const HIRE_SIGNAL_COMPANY_COHORT_UUID_CAP = 2000;

function cohortTokenConditions(
  field: string,
  tokens: string[],
): VqlConditionInput[] {
  const trimmed = tokens.map((n) => String(n).trim()).filter(Boolean);
  if (trimmed.length === 0) return [];
  if (trimmed.length === 1) {
    return [
      {
        field,
        operator: "eq",
        value: trimmed[0] as unknown as VqlConditionInput["value"],
      },
    ];
  }
  return [
    {
      field,
      operator: "in",
      value: trimmed as unknown as VqlConditionInput["value"],
    },
  ];
}

export function isCompanyCohortActive(draft: HiringSignalFilterDraft): boolean {
  if (draft.companyNames.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyNames.some((n) => String(n).trim())) return true;
  if (draft.companyFunding.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyFunding.some((n) => String(n).trim())) return true;
  if (draft.companyCountries.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyCountries.some((n) => String(n).trim())) return true;
  if (draft.companyIndustries.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyIndustries.some((n) => String(n).trim())) return true;
  if (draft.companyEmployeeSizes.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyEmployeeSizes.some((n) => String(n).trim())) return true;
  for (const [key, vals] of Object.entries(draft.companyFacetValues)) {
    if (!HIRE_SIGNAL_COMPANY_COHORT_KEYS.has(key)) continue;
    if (key === HIRE_SIGNAL_COMPANY_FUNDING_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_COUNTRY_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_INDUSTRY_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_EMPLOYEE_SIZE_FIELD) continue;
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
    if (key === HIRE_SIGNAL_COMPANY_FUNDING_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_COUNTRY_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_INDUSTRY_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_EMPLOYEE_SIZE_FIELD) continue;
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

/** Exact company names from job postings → Connectra `name` field (eq / in). */
export function companyNameFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const conditions = cohortTokenConditions("name", draft.companyNames);
  if (conditions.length === 0) return undefined;
  return { conditions };
}

/** Included funding buckets → Connectra `total_funding` range (OR across buckets). */
export function companyFundingFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  return companyFundingTokensToVqlFilter(draft.companyFunding);
}

/** Include-only Connectra cohort filters (firmographics + included company names). */
export function companyCohortIncludeFiltersFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const parts: VqlFilterInput[] = [];
  const facet = companyFacetFilterFromDraft(draft);
  const names = companyNameFilterFromDraft(draft);
  const funding = companyFundingFilterFromDraft(draft);
  const countries = companyCountryFilterFromDraft(draft);
  const industries = companyIndustryFilterFromDraft(draft);
  const employeeSizes = companyEmployeeSizeFilterFromDraft(draft);
  if (facet) parts.push(facet);
  if (names) parts.push(names);
  if (funding) parts.push(funding);
  if (countries) parts.push(countries);
  if (industries) parts.push(industries);
  if (employeeSizes) parts.push(employeeSizes);
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { allOf: parts };
}

/** @deprecated Use {@link companyCohortIncludeFiltersFromDraft}. */
export const companyCohortFiltersFromDraft =
  companyCohortIncludeFiltersFromDraft;

/** Excluded company names → Connectra `name` eq/in (resolved separately from include). */
export function companyNameExcludeFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const conditions = cohortTokenConditions("name", draft.excludedCompanyNames);
  if (conditions.length === 0) return undefined;
  return { conditions };
}

/** Included countries → Connectra `country` eq/in. */
export function companyCountryFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const conditions = cohortTokenConditions(
    HIRE_SIGNAL_COMPANY_COUNTRY_FIELD,
    draft.companyCountries,
  );
  if (conditions.length === 0) return undefined;
  return { conditions };
}

/** Excluded funding buckets → Connectra `total_funding` range (OR). */
export function companyFundingExcludeFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  return companyFundingTokensToVqlFilter(draft.excludedCompanyFunding);
}

/** Excluded countries → Connectra `country` eq/in. */
export function companyCountryExcludeFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const conditions = cohortTokenConditions(
    HIRE_SIGNAL_COMPANY_COUNTRY_FIELD,
    draft.excludedCompanyCountries,
  );
  if (conditions.length === 0) return undefined;
  return { conditions };
}

/** Included industries → Connectra `industries` eq/in. */
export function companyIndustryFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const conditions = cohortTokenConditions(
    HIRE_SIGNAL_COMPANY_INDUSTRY_FIELD,
    draft.companyIndustries,
  );
  if (conditions.length === 0) return undefined;
  return { conditions };
}

/** Excluded industries → Connectra `industries` eq/in. */
export function companyIndustryExcludeFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const conditions = cohortTokenConditions(
    HIRE_SIGNAL_COMPANY_INDUSTRY_FIELD,
    draft.excludedCompanyIndustries,
  );
  if (conditions.length === 0) return undefined;
  return { conditions };
}

/** Included employee-size buckets → Connectra `employees_count` range (OR across buckets). */
export function companyEmployeeSizeFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  return companyEmployeeSizeTokensToVqlFilter(draft.companyEmployeeSizes);
}

/** Excluded employee-size buckets → Connectra `employees_count` range (OR). */
export function companyEmployeeSizeExcludeFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  return companyEmployeeSizeTokensToVqlFilter(
    draft.excludedCompanyEmployeeSizes,
  );
}

/** All exclude cohort dimensions merged for UUID resolution. */
export function companyCohortExcludeFiltersFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const parts: VqlFilterInput[] = [];
  const names = companyNameExcludeFilterFromDraft(draft);
  const funding = companyFundingExcludeFilterFromDraft(draft);
  const countries = companyCountryExcludeFilterFromDraft(draft);
  const industries = companyIndustryExcludeFilterFromDraft(draft);
  const employeeSizes = companyEmployeeSizeExcludeFilterFromDraft(draft);
  if (names) parts.push(names);
  if (funding) parts.push(funding);
  if (countries) parts.push(countries);
  if (industries) parts.push(industries);
  if (employeeSizes) parts.push(employeeSizes);
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { allOf: parts };
}

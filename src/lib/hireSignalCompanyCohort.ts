import type {
  VqlConditionInput,
  VqlFilterInput,
} from "@/graphql/generated/types";
import type { HiringSignalFilterDraft } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import {
  companyEmployeeSizeTokensToVqlFilter,
  HIRE_SIGNAL_COMPANY_EMPLOYEE_SIZE_FIELD,
} from "@/lib/hireSignalCompanyEmployeeSizeBuckets";
import {
  companyFundingTokensToVqlFilter,
  HIRE_SIGNAL_COMPANY_FUNDING_FIELD,
} from "@/lib/hireSignalCompanyFundingBuckets";
import {
  companyRevenueTokensToVqlFilter,
  HIRE_SIGNAL_COMPANY_REVENUE_FIELD,
} from "@/lib/hireSignalCompanyRevenueBuckets";

export { HIRE_SIGNAL_COMPANY_FUNDING_FIELD };
export { HIRE_SIGNAL_COMPANY_REVENUE_FIELD };

/** Legacy Connectra facet keys (none — all firmographics use dedicated UI). */
export const HIRE_SIGNAL_COMPANY_COHORT_FACET_KEYS = [] as const;

export type HireSignalCompanyCohortFacetKey =
  (typeof HIRE_SIGNAL_COMPANY_COHORT_FACET_KEYS)[number];

export const HIRE_SIGNAL_COMPANY_COHORT_SECTIONS: ReadonlyArray<{
  filterKey: HireSignalCompanyCohortFacetKey;
  title: string;
}> = [];

export const HIRE_SIGNAL_COMPANY_COHORT_KEYS = new Set<string>([
  ...HIRE_SIGNAL_COMPANY_COHORT_FACET_KEYS,
]);

export const HIRE_SIGNAL_COMPANY_COHORT_LABELS: Record<
  HireSignalCompanyCohortFacetKey,
  string
> = {} as Record<HireSignalCompanyCohortFacetKey, string>;

/** Connectra company index field for country (dedicated include/exclude UI). */
export const HIRE_SIGNAL_COMPANY_COUNTRY_FIELD = "country" as const;

/** Connectra company index field for industry (dedicated include/exclude UI). */
export const HIRE_SIGNAL_COMPANY_INDUSTRY_FIELD = "industries" as const;

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
  if (draft.companyRevenue.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyRevenue.some((n) => String(n).trim())) return true;
  if (draft.companyCountries.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyCountries.some((n) => String(n).trim())) return true;
  if (draft.companyIndustries.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyIndustries.some((n) => String(n).trim()))
    return true;
  if (draft.companyEmployeeSizes.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyEmployeeSizes.some((n) => String(n).trim()))
    return true;
  for (const [key, vals] of Object.entries(draft.companyFacetValues)) {
    if (!HIRE_SIGNAL_COMPANY_COHORT_KEYS.has(key)) continue;
    if (key === HIRE_SIGNAL_COMPANY_FUNDING_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_REVENUE_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_COUNTRY_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_INDUSTRY_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_EMPLOYEE_SIZE_FIELD) continue;
    if (vals.some((v) => String(v).trim())) return true;
  }
  return false;
}

/** Build Connectra `filters` from legacy `companyFacetValues` only. */
export function companyFacetFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const conditions: VqlConditionInput[] = [];
  for (const [key, vals] of Object.entries(draft.companyFacetValues)) {
    if (!HIRE_SIGNAL_COMPANY_COHORT_KEYS.has(key)) continue;
    if (key === HIRE_SIGNAL_COMPANY_FUNDING_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_REVENUE_FIELD) continue;
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

export function companyNameFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const conditions = cohortTokenConditions("name", draft.companyNames);
  if (conditions.length === 0) return undefined;
  return { conditions };
}

export function companyFundingFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  return companyFundingTokensToVqlFilter(draft.companyFunding);
}

export function companyRevenueFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  return companyRevenueTokensToVqlFilter(draft.companyRevenue);
}

/** Connectra include filters for firmographics only (not posting employer names). */
export function companyCohortIncludeFiltersExcludingNamesFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const parts: VqlFilterInput[] = [];
  const facet = companyFacetFilterFromDraft(draft);
  const funding = companyFundingFilterFromDraft(draft);
  const revenue = companyRevenueFilterFromDraft(draft);
  const countries = companyCountryFilterFromDraft(draft);
  const industries = companyIndustryFilterFromDraft(draft);
  const employeeSizes = companyEmployeeSizeFilterFromDraft(draft);
  if (facet) parts.push(facet);
  if (funding) parts.push(funding);
  if (revenue) parts.push(revenue);
  if (countries) parts.push(countries);
  if (industries) parts.push(industries);
  if (employeeSizes) parts.push(employeeSizes);
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { allOf: parts };
}

export function companyCohortIncludeFiltersFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const parts: VqlFilterInput[] = [];
  const firmographic = companyCohortIncludeFiltersExcludingNamesFromDraft(draft);
  const names = companyNameFilterFromDraft(draft);
  if (firmographic) parts.push(firmographic);
  if (names) parts.push(names);
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { allOf: parts };
}

/** @deprecated Use {@link companyCohortIncludeFiltersFromDraft}. */
export const companyCohortFiltersFromDraft =
  companyCohortIncludeFiltersFromDraft;

export function companyNameExcludeFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const conditions = cohortTokenConditions("name", draft.excludedCompanyNames);
  if (conditions.length === 0) return undefined;
  return { conditions };
}

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

export function companyFundingExcludeFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  return companyFundingTokensToVqlFilter(draft.excludedCompanyFunding);
}

export function companyRevenueExcludeFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  return companyRevenueTokensToVqlFilter(draft.excludedCompanyRevenue);
}

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

export function companyEmployeeSizeFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  return companyEmployeeSizeTokensToVqlFilter(draft.companyEmployeeSizes);
}

export function companyEmployeeSizeExcludeFilterFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  return companyEmployeeSizeTokensToVqlFilter(
    draft.excludedCompanyEmployeeSizes,
  );
}

/** Connectra exclude filters for firmographics only (not posting employer names). */
export function companyCohortExcludeFiltersExcludingNamesFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const parts: VqlFilterInput[] = [];
  const funding = companyFundingExcludeFilterFromDraft(draft);
  const revenue = companyRevenueExcludeFilterFromDraft(draft);
  const countries = companyCountryExcludeFilterFromDraft(draft);
  const industries = companyIndustryExcludeFilterFromDraft(draft);
  const employeeSizes = companyEmployeeSizeExcludeFilterFromDraft(draft);
  if (funding) parts.push(funding);
  if (revenue) parts.push(revenue);
  if (countries) parts.push(countries);
  if (industries) parts.push(industries);
  if (employeeSizes) parts.push(employeeSizes);
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { allOf: parts };
}

export function companyCohortExcludeFiltersFromDraft(
  draft: HiringSignalFilterDraft,
): VqlFilterInput | undefined {
  const parts: VqlFilterInput[] = [];
  const firmographic = companyCohortExcludeFiltersExcludingNamesFromDraft(draft);
  const names = companyNameExcludeFilterFromDraft(draft);
  if (firmographic) parts.push(firmographic);
  if (names) parts.push(names);
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { allOf: parts };
}

/** True when any company cohort filter is set except posting employer names. */
export function isCompanyCohortActiveExcludingNames(
  draft: HiringSignalFilterDraft,
): boolean {
  if (draft.companyFunding.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyFunding.some((n) => String(n).trim())) return true;
  if (draft.companyRevenue.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyRevenue.some((n) => String(n).trim())) return true;
  if (draft.companyCountries.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyCountries.some((n) => String(n).trim())) return true;
  if (draft.companyIndustries.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyIndustries.some((n) => String(n).trim()))
    return true;
  if (draft.companyEmployeeSizes.some((n) => String(n).trim())) return true;
  if (draft.excludedCompanyEmployeeSizes.some((n) => String(n).trim()))
    return true;
  for (const [key, vals] of Object.entries(draft.companyFacetValues)) {
    if (!HIRE_SIGNAL_COMPANY_COHORT_KEYS.has(key)) continue;
    if (key === HIRE_SIGNAL_COMPANY_FUNDING_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_REVENUE_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_COUNTRY_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_INDUSTRY_FIELD) continue;
    if (key === HIRE_SIGNAL_COMPANY_EMPLOYEE_SIZE_FIELD) continue;
    if (vals.some((v) => String(v).trim())) return true;
  }
  return false;
}

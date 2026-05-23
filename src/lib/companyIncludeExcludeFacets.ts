/** Company sidebar facets with include/exclude dropdowns and per-value counts. */
export const COMPANY_INCLUDE_EXCLUDE_FILTER_KEYS = [
  "address",
  "city",
  "country",
  "industries",
  "keywords",
  "state",
  "technologies",
  "uuid",
  "website",
  "linkedin_url",
  "normalized_domain",
] as const;

export type CompanyIncludeExcludeFilterKey =
  (typeof COMPANY_INCLUDE_EXCLUDE_FILTER_KEYS)[number];

const INCLUDE_EXCLUDE_SET = new Set<string>(
  COMPANY_INCLUDE_EXCLUDE_FILTER_KEYS,
);

/** Sidebar filter_key → Connectra/VQL field used when applying selections. */
export const COMPANY_FACET_KEY_TO_VQL_FIELD: Partial<
  Record<CompanyIncludeExcludeFilterKey, string>
> = {
  uuid: "name",
};

export function companyFacetVqlField(filterKey: string): string {
  return (
    COMPANY_FACET_KEY_TO_VQL_FIELD[
      filterKey as CompanyIncludeExcludeFilterKey
    ] ?? filterKey
  );
}

export function isCompanyIncludeExcludeFacet(
  filterKey: string,
): filterKey is CompanyIncludeExcludeFilterKey {
  return INCLUDE_EXCLUDE_SET.has(filterKey);
}

const COMBOBOX_LABELS: Record<
  CompanyIncludeExcludeFilterKey,
  { include: string; exclude: string }
> = {
  address: { include: "Include addresses", exclude: "Exclude addresses" },
  city: { include: "Include cities", exclude: "Exclude cities" },
  country: { include: "Include countries", exclude: "Exclude countries" },
  industries: { include: "Include industries", exclude: "Exclude industries" },
  keywords: { include: "Include keywords", exclude: "Exclude keywords" },
  state: { include: "Include states", exclude: "Exclude states" },
  technologies: {
    include: "Include technologies",
    exclude: "Exclude technologies",
  },
  uuid: { include: "Include company names", exclude: "Exclude company names" },
  website: { include: "Include websites", exclude: "Exclude websites" },
  linkedin_url: {
    include: "Include LinkedIn URLs",
    exclude: "Exclude LinkedIn URLs",
  },
  normalized_domain: {
    include: "Include domains",
    exclude: "Exclude domains",
  },
};

export function companyFacetComboboxLabels(
  filterKey: string,
  displayName: string,
): { include: string; exclude: string } {
  if (isCompanyIncludeExcludeFacet(filterKey)) {
    return COMBOBOX_LABELS[filterKey];
  }
  const lower = displayName.trim().toLowerCase() || filterKey;
  return {
    include: `Include ${lower}`,
    exclude: `Exclude ${lower}`,
  };
}

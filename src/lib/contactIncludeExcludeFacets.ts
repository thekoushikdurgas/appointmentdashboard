/** Contact sidebar facets with include/exclude dropdowns and per-value counts. */
export const CONTACT_INCLUDE_EXCLUDE_FILTER_KEYS = [
  "city",
  "country",
  "departments",
  "email_status",
  "seniority",
  "state",
  "title",
  "company_address",
  "company_city",
  "company_country",
  "company_industries",
  "company_keywords",
  "company_state",
  "company_technologies",
  "company_name",
  "company_website",
  "company_linkedin_url",
  "company_normalized_domain",
] as const;

export type ContactIncludeExcludeFilterKey =
  (typeof CONTACT_INCLUDE_EXCLUDE_FILTER_KEYS)[number];

const INCLUDE_EXCLUDE_SET = new Set<string>(
  CONTACT_INCLUDE_EXCLUDE_FILTER_KEYS,
);

export function isContactIncludeExcludeFacet(
  filterKey: string,
): filterKey is ContactIncludeExcludeFilterKey {
  return INCLUDE_EXCLUDE_SET.has(filterKey);
}

const COMBOBOX_LABELS: Record<
  ContactIncludeExcludeFilterKey,
  { include: string; exclude: string }
> = {
  city: { include: "Include cities", exclude: "Exclude cities" },
  country: { include: "Include countries", exclude: "Exclude countries" },
  departments: {
    include: "Include departments",
    exclude: "Exclude departments",
  },
  email_status: {
    include: "Include email status",
    exclude: "Exclude email status",
  },
  seniority: { include: "Include seniority", exclude: "Exclude seniority" },
  state: { include: "Include states", exclude: "Exclude states" },
  title: { include: "Include titles", exclude: "Exclude titles" },
  company_address: {
    include: "Include company addresses",
    exclude: "Exclude company addresses",
  },
  company_city: {
    include: "Include company cities",
    exclude: "Exclude company cities",
  },
  company_country: {
    include: "Include company countries",
    exclude: "Exclude company countries",
  },
  company_industries: {
    include: "Include company industries",
    exclude: "Exclude company industries",
  },
  company_keywords: {
    include: "Include company keywords",
    exclude: "Exclude company keywords",
  },
  company_state: {
    include: "Include company states",
    exclude: "Exclude company states",
  },
  company_technologies: {
    include: "Include company technologies",
    exclude: "Exclude company technologies",
  },
  company_name: {
    include: "Include company names",
    exclude: "Exclude company names",
  },
  company_website: {
    include: "Include company websites",
    exclude: "Exclude company websites",
  },
  company_linkedin_url: {
    include: "Include company LinkedIn URLs",
    exclude: "Exclude company LinkedIn URLs",
  },
  company_normalized_domain: {
    include: "Include company domains",
    exclude: "Exclude company domains",
  },
};

export function contactFacetComboboxLabels(
  filterKey: string,
  displayName: string,
): { include: string; exclude: string } {
  if (isContactIncludeExcludeFacet(filterKey)) {
    return COMBOBOX_LABELS[filterKey];
  }
  const lower = displayName.trim().toLowerCase() || filterKey;
  return {
    include: `Include ${lower}`,
    exclude: `Exclude ${lower}`,
  };
}

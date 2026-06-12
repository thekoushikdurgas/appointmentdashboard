/** Stable accordion section ids for the Companies filter sidebar. */
export const COMPANY_FILTER_SECTION_IDS = {
  sort: "meta-sort",
  view: "meta-view",
  search: "meta-search",
  companyName: "company-name",
  companyWebsite: "company-website",
  companyLinkedin: "company-linkedin",
  companyDomain: "company-domain",
  companyEmployees: "company-employees",
  companyRevenue: "company-revenue",
  companyFunding: "company-funding",
  companyIndustries: "company-industries",
  companyKeywords: "company-keywords",
  companyTechnologies: "company-technologies",
  companyAddress: "company-address",
  companyCity: "company-city",
  companyState: "company-state",
  companyCountry: "company-country",
  columns: "meta-columns",
  advanced: "meta-advanced",
} as const;

export type CompanyFilterSectionId =
  (typeof COMPANY_FILTER_SECTION_IDS)[keyof typeof COMPANY_FILTER_SECTION_IDS];

/** Maps API `filterKey` → stable accordion section id. */
export const COMPANY_FILTER_KEY_TO_SECTION_ID: Record<string, string> = {
  uuid: COMPANY_FILTER_SECTION_IDS.companyName,
  website: COMPANY_FILTER_SECTION_IDS.companyWebsite,
  linkedin_url: COMPANY_FILTER_SECTION_IDS.companyLinkedin,
  normalized_domain: COMPANY_FILTER_SECTION_IDS.companyDomain,
  employees_count: COMPANY_FILTER_SECTION_IDS.companyEmployees,
  annual_revenue: COMPANY_FILTER_SECTION_IDS.companyRevenue,
  total_funding: COMPANY_FILTER_SECTION_IDS.companyFunding,
  industries: COMPANY_FILTER_SECTION_IDS.companyIndustries,
  keywords: COMPANY_FILTER_SECTION_IDS.companyKeywords,
  technologies: COMPANY_FILTER_SECTION_IDS.companyTechnologies,
  address: COMPANY_FILTER_SECTION_IDS.companyAddress,
  city: COMPANY_FILTER_SECTION_IDS.companyCity,
  state: COMPANY_FILTER_SECTION_IDS.companyState,
  country: COMPANY_FILTER_SECTION_IDS.companyCountry,
};

export type CompanyFilterGroupId =
  | "identity"
  | "firmographics"
  | "classification"
  | "location";

export const COMPANY_FILTER_GROUPS: Array<{
  id: CompanyFilterGroupId;
  label: string;
  filterKeys: string[];
}> = [
  {
    id: "identity",
    label: "Identity",
    filterKeys: ["uuid", "website", "linkedin_url", "normalized_domain"],
  },
  {
    id: "firmographics",
    label: "Firmographics",
    filterKeys: ["employees_count", "annual_revenue", "total_funding"],
  },
  {
    id: "classification",
    label: "Classification",
    filterKeys: ["industries", "keywords", "technologies"],
  },
  {
    id: "location",
    label: "Location",
    filterKeys: ["address", "city", "state", "country"],
  },
];

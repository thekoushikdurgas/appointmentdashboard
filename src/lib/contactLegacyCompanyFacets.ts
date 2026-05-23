/** Maps legacy company-index facet keys (sidebar ``companyFacetValues``) to contact-index keys. */
export const LEGACY_COMPANY_FACET_TO_CONTACT_KEY: Record<string, string> = {
  address: "company_address",
  annual_revenue: "company_annual_revenue",
  city: "company_city",
  country: "company_country",
  employees_count: "company_employees_count",
  industries: "company_industries",
  keywords: "company_keywords",
  linkedin_url: "company_linkedin_url",
  normalized_domain: "company_normalized_domain",
  state: "company_state",
  technologies: "company_technologies",
  total_funding: "company_total_funding",
  uuid: "company_name",
  website: "company_website",
};

export function mergeLegacyCompanyFacetValues(
  facetValues: Record<string, string[]>,
  companyFacetValues?: Record<string, string[]>,
): Record<string, string[]> {
  if (!companyFacetValues) return facetValues;
  const merged = { ...facetValues };
  for (const [legacyKey, vals] of Object.entries(companyFacetValues)) {
    if (!vals?.length) continue;
    const target =
      LEGACY_COMPANY_FACET_TO_CONTACT_KEY[legacyKey] ?? legacyKey;
    if (!merged[target]?.length) merged[target] = vals;
  }
  return merged;
}

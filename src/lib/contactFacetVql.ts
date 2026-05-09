/**
 * Maps Connectra contact-sidebar facet `filterKey` values to contact-index VQL field names.
 *
 * Contact documents store the related company on `company_id` and denormalized `company_*`
 * columns. Company-list facets use plain company-index keys (`industries`, `uuid`, …); if
 * those keys appear on the contacts UI, queries must target the contact index fields instead.
 * Keys shared by both indices (`city`, `country`, `linkedin_url`, …) are not remapped — when
 * `service === contact`, those facets keep person-level semantics.
 */

/** Company-only facet keys (not in the contact filters seed) → contact denormalized fields. */
const COMPANY_NATIVE_KEY_TO_CONTACT_FIELD: Record<string, string> = {
  industries: "company_industries",
  keywords: "company_keywords",
  technologies: "company_technologies",
  employees_count: "company_employees_count",
  annual_revenue: "company_annual_revenue",
  total_funding: "company_total_funding",
  normalized_domain: "company_normalized_domain",
  website: "company_website",
  address: "company_address",
  name: "company_name",
};

/**
 * @param filterKey — `ContactFilter.filterKey` from `/contacts/filters`
 * @param displayName — `ContactFilter.displayName` when ambiguity needs disambiguation
 */
export function contactVqlFieldForFacetFilterKey(
  filterKey: string,
  displayName?: string | null,
): string {
  const k = filterKey.trim();
  const dn = displayName?.trim().toLowerCase() ?? "";

  if (k.startsWith("company_")) return k;

  if (k === "uuid" && dn === "company id") return "company_id";

  if (dn === "company id" && (k === "id" || k === "company_uuid"))
    return "company_id";

  const mapped = COMPANY_NATIVE_KEY_TO_CONTACT_FIELD[k];
  if (mapped) return mapped;

  return k;
}

/**
 * Maps **company**-service facet `filterKey` (company index) to **contact**-index VQL fields.
 * Used only for facets loaded from `companiesService.getFilters` / `filterData` on the contacts page.
 */
export function contactVqlFieldForCompanyFacetFilterKey(
  filterKey: string,
): string {
  const k = filterKey.trim();
  if (k.startsWith("company_")) return k;

  const companyKeyToContact: Record<string, string> = {
    uuid: "company_id",
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
    website: "company_website",
    name: "company_name",
  };

  return companyKeyToContact[k] ?? k;
}

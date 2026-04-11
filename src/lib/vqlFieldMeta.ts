/** Static field catalog for VQL builder (aligns with Connectra / OpenSearch indices). */

export type VqlFieldType = "text" | "keyword" | "range";

export interface VqlFieldMeta {
  key: string;
  label: string;
  type: VqlFieldType;
  sortable?: boolean;
  ngram?: boolean;
  /** Denormalized company_* on contact index — filter only, not select_columns */
  filterOnly?: boolean;
  group: "contact" | "company_denorm" | "company";
}

const CONTACT_CORE: VqlFieldMeta[] = [
  {
    key: "first_name",
    label: "First name",
    type: "text",
    sortable: false,
    ngram: true,
    group: "contact",
  },
  {
    key: "last_name",
    label: "Last name",
    type: "text",
    sortable: false,
    ngram: true,
    group: "contact",
  },
  {
    key: "title",
    label: "Title",
    type: "text",
    sortable: false,
    group: "contact",
  },
  {
    key: "email",
    label: "Email",
    type: "keyword",
    sortable: false,
    group: "contact",
  },
  {
    key: "linkedin_url",
    label: "LinkedIn URL",
    type: "text",
    sortable: false,
    group: "contact",
  },
  {
    key: "city",
    label: "City",
    type: "text",
    sortable: false,
    group: "contact",
  },
  {
    key: "state",
    label: "State",
    type: "text",
    sortable: false,
    group: "contact",
  },
  {
    key: "country",
    label: "Country",
    type: "text",
    sortable: false,
    group: "contact",
  },
  {
    key: "company_id",
    label: "Company ID",
    type: "keyword",
    sortable: true,
    group: "contact",
  },
  {
    key: "departments",
    label: "Departments",
    type: "keyword",
    sortable: true,
    group: "contact",
  },
  {
    key: "mobile_phone",
    label: "Mobile phone",
    type: "keyword",
    sortable: true,
    group: "contact",
  },
  {
    key: "email_status",
    label: "Email status",
    type: "keyword",
    sortable: true,
    group: "contact",
  },
  {
    key: "seniority",
    label: "Seniority",
    type: "keyword",
    sortable: true,
    group: "contact",
  },
  { key: "status", label: "Status", type: "keyword", group: "contact" },
  { key: "uuid", label: "UUID", type: "keyword", group: "contact" },
  {
    key: "created_at",
    label: "Created at",
    type: "range",
    sortable: true,
    group: "contact",
  },
  {
    key: "updated_at",
    label: "Updated at",
    type: "range",
    sortable: true,
    group: "contact",
  },
];

const COMPANY_DENORM: VqlFieldMeta[] = [
  {
    key: "company_name",
    label: "Company name",
    type: "text",
    filterOnly: true,
    group: "company_denorm",
  },
  {
    key: "company_address",
    label: "Company address",
    type: "text",
    filterOnly: true,
    group: "company_denorm",
  },
  {
    key: "company_city",
    label: "Company city",
    type: "text",
    filterOnly: true,
    group: "company_denorm",
  },
  {
    key: "company_state",
    label: "Company state",
    type: "text",
    filterOnly: true,
    group: "company_denorm",
  },
  {
    key: "company_country",
    label: "Company country",
    type: "text",
    filterOnly: true,
    group: "company_denorm",
  },
  {
    key: "company_linkedin_url",
    label: "Company LinkedIn",
    type: "text",
    filterOnly: true,
    group: "company_denorm",
  },
  {
    key: "company_website",
    label: "Company website",
    type: "text",
    filterOnly: true,
    group: "company_denorm",
  },
  {
    key: "company_normalized_domain",
    label: "Company domain",
    type: "text",
    filterOnly: true,
    group: "company_denorm",
  },
  {
    key: "company_industries",
    label: "Company industries",
    type: "keyword",
    filterOnly: true,
    group: "company_denorm",
  },
  {
    key: "company_keywords",
    label: "Company keywords",
    type: "keyword",
    filterOnly: true,
    group: "company_denorm",
  },
  {
    key: "company_technologies",
    label: "Company technologies",
    type: "keyword",
    filterOnly: true,
    group: "company_denorm",
  },
  {
    key: "company_employees_count",
    label: "Company employees",
    type: "range",
    filterOnly: true,
    group: "company_denorm",
  },
  {
    key: "company_annual_revenue",
    label: "Company revenue",
    type: "range",
    filterOnly: true,
    group: "company_denorm",
  },
  {
    key: "company_total_funding",
    label: "Company funding",
    type: "range",
    filterOnly: true,
    group: "company_denorm",
  },
];

const COMPANY_FIELDS: VqlFieldMeta[] = [
  {
    key: "name",
    label: "Name",
    type: "text",
    sortable: false,
    ngram: true,
    group: "company",
  },
  {
    key: "address",
    label: "Address",
    type: "text",
    sortable: false,
    group: "company",
  },
  {
    key: "city",
    label: "City",
    type: "text",
    sortable: false,
    group: "company",
  },
  {
    key: "state",
    label: "State",
    type: "text",
    sortable: false,
    group: "company",
  },
  {
    key: "country",
    label: "Country",
    type: "text",
    sortable: false,
    group: "company",
  },
  {
    key: "linkedin_url",
    label: "LinkedIn URL",
    type: "text",
    sortable: false,
    group: "company",
  },
  {
    key: "website",
    label: "Website",
    type: "text",
    sortable: false,
    group: "company",
  },
  {
    key: "normalized_domain",
    label: "Domain",
    type: "text",
    sortable: false,
    group: "company",
  },
  {
    key: "industries",
    label: "Industries",
    type: "keyword",
    sortable: true,
    group: "company",
  },
  {
    key: "keywords",
    label: "Keywords",
    type: "keyword",
    sortable: true,
    group: "company",
  },
  {
    key: "technologies",
    label: "Technologies",
    type: "keyword",
    sortable: true,
    group: "company",
  },
  { key: "uuid", label: "UUID", type: "keyword", group: "company" },
  {
    key: "employees_count",
    label: "Employees",
    type: "range",
    sortable: true,
    group: "company",
  },
  {
    key: "annual_revenue",
    label: "Annual revenue",
    type: "range",
    sortable: true,
    group: "company",
  },
  {
    key: "total_funding",
    label: "Total funding",
    type: "range",
    sortable: true,
    group: "company",
  },
  {
    key: "created_at",
    label: "Created at",
    type: "range",
    sortable: true,
    group: "company",
  },
  {
    key: "updated_at",
    label: "Updated at",
    type: "range",
    sortable: true,
    group: "company",
  },
];

export function getFieldsForEntity(
  entityType: "contact" | "company",
): VqlFieldMeta[] {
  if (entityType === "company") return [...COMPANY_FIELDS];
  return [...CONTACT_CORE, ...COMPANY_DENORM];
}

export function getFieldMeta(
  key: string,
  entityType: "contact" | "company",
): VqlFieldMeta | undefined {
  return getFieldsForEntity(entityType).find((f) => f.key === key);
}

export function getFieldType(
  key: string,
  entityType: "contact" | "company",
): VqlFieldType {
  return getFieldMeta(key, entityType)?.type ?? "keyword";
}

export function sortableFields(
  entityType: "contact" | "company",
): VqlFieldMeta[] {
  return getFieldsForEntity(entityType).filter((f) => f.sortable);
}

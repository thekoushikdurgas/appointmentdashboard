/** Shared column metadata for companies list + filter sidebar (avoid importing DataGrid in sidebar). */

export const COMPANIES_DT_PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
] as const;

export const COMPANIES_DT_COLUMN_IDS = [
  "name",
  "industries",
  "employees",
  "location",
  "domain",
  "contacts",
  "added",
  "action",
] as const;

export type CompaniesDataTableColumnId =
  (typeof COMPANIES_DT_COLUMN_IDS)[number];

export const COMPANIES_DT_DEFAULT_COLUMNS: CompaniesDataTableColumnId[] = [
  ...COMPANIES_DT_COLUMN_IDS,
];

export const COMPANIES_DT_COLUMN_LABELS: Record<
  CompaniesDataTableColumnId,
  string
> = {
  name: "Company",
  industries: "Industries",
  employees: "Employees",
  location: "Location",
  domain: "Domain",
  contacts: "Contacts",
  added: "Added",
  action: "Actions",
};

export const COL_ID_TO_FIELD: Record<CompaniesDataTableColumnId, string> = {
  name: "name",
  industries: "industries",
  employees: "employeeCount",
  location: "location",
  domain: "domain",
  contacts: "contactCount",
  added: "createdAt",
  action: "action",
};

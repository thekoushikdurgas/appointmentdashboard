import type { ContactsDataTableColumnId } from "@/components/feature/contacts/ContactsDataTable";

/** Map data-table column toggles → Connectra ``select_columns`` (contact fields). */
export const CONTACT_COLUMN_TO_VQL_FIELDS: Record<
  ContactsDataTableColumnId,
  string[]
> = {
  ref: ["uuid"],
  added: ["created_at"],
  name: ["first_name", "last_name"],
  title: ["title"],
  region: ["city", "state", "country"],
  status: ["email_status"],
  company: [],
  email: ["email"],
  action: [],
};

export function visibleColumnsNeedCompanyPopulate(
  cols: ContactsDataTableColumnId[],
): boolean {
  return cols.includes("company");
}

export function selectColumnsFromVisibleColumns(
  cols: ContactsDataTableColumnId[],
): string[] {
  const set = new Set<string>();
  for (const c of cols) {
    for (const f of CONTACT_COLUMN_TO_VQL_FIELDS[c] ?? []) set.add(f);
  }
  return [...set];
}

export function defaultCompanySelectWhenPopulate(): string[] {
  return [
    "uuid",
    "name",
    "website",
    "employees_count",
    "industries",
    "linkedin_url",
  ];
}

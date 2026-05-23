/** Contact sidebar facets with include/exclude dropdowns and per-value counts. */
export const CONTACT_INCLUDE_EXCLUDE_FILTER_KEYS = [
  "city",
  "country",
  "departments",
  "email_status",
  "seniority",
  "state",
  "title",
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

"use client";

import {
  IncludeExcludeFacetFilter,
  type IncludeExcludeFacetFilterProps,
} from "@/components/shared/IncludeExcludeFacetFilter";
import type { FilterSection } from "@/hooks/useContactFilters";

export type ContactIncludeExcludeFacetFilterProps = Omit<
  IncludeExcludeFacetFilterProps,
  "section"
> & { section: FilterSection };

/** Facet with include/exclude dropdowns and per-value contact counts in brackets. */
export function ContactIncludeExcludeFacetFilter({
  section,
  ...rest
}: ContactIncludeExcludeFacetFilterProps) {
  return <IncludeExcludeFacetFilter section={section} {...rest} />;
}

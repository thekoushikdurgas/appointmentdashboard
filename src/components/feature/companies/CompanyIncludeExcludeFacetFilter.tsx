"use client";

import {
  IncludeExcludeFacetFilter,
  type IncludeExcludeFacetFilterProps,
} from "@/components/shared/IncludeExcludeFacetFilter";
import type { CompanyFilterSection } from "@/hooks/useCompanyFilters";

export type CompanyIncludeExcludeFacetFilterProps = Omit<
  IncludeExcludeFacetFilterProps,
  "section"
> & { section: CompanyFilterSection };

/** Facet with include/exclude dropdowns and per-value company counts in brackets. */
export function CompanyIncludeExcludeFacetFilter({
  section,
  ...rest
}: CompanyIncludeExcludeFacetFilterProps) {
  return <IncludeExcludeFacetFilter section={section} {...rest} />;
}

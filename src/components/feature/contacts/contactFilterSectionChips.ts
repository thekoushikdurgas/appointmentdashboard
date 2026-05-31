import { isContactIncludeExcludeFacet } from "@/lib/contactIncludeExcludeFacets";
import {
  formatCompanyRangeBucketLabel,
  isCompanyRangeBucketFacet,
} from "@/lib/companyRangeBuckets";

export type ContactFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

/** Active-value chips for one facet block (include / exclude / keyword). */
export function buildFacetSectionChips(
  filterKey: string,
  displayName: string,
  facetValues: Record<string, string[]>,
  excludedFacetValues: Record<string, string[]>,
  onFacetChange: (key: string, values: string[]) => void,
  onExcludedFacetChange?: (key: string, values: string[]) => void,
): ContactFilterChip[] {
  const out: ContactFilterChip[] = [];
  const included = facetValues[filterKey] ?? [];
  const excluded = excludedFacetValues[filterKey] ?? [];
  const includePrefix = isContactIncludeExcludeFacet(filterKey)
    ? "Include "
    : "";

  for (const value of included) {
    const valueLabel = isCompanyRangeBucketFacet(filterKey)
      ? formatCompanyRangeBucketLabel(filterKey, value)
      : value;
    out.push({
      key: `facet-include-${filterKey}-${value}`,
      label: `${includePrefix}${displayName}: ${valueLabel}`,
      onRemove: () =>
        onFacetChange(
          filterKey,
          included.filter((v) => v !== value),
        ),
    });
  }

  if (onExcludedFacetChange) {
    for (const value of excluded) {
      const valueLabel = isCompanyRangeBucketFacet(filterKey)
        ? formatCompanyRangeBucketLabel(filterKey, value)
        : value;
      out.push({
        key: `facet-exclude-${filterKey}-${value}`,
        label: `Exclude ${displayName}: ${valueLabel}`,
        onRemove: () =>
          onExcludedFacetChange(
            filterKey,
            excluded.filter((v) => v !== value),
          ),
      });
    }
  }

  return out;
}

export function buildEmailSearchChip(
  search: string,
  onClearSearch: () => void,
): ContactFilterChip[] {
  const trimmed = search.trim();
  if (!trimmed) return [];
  return [
    {
      key: "search",
      label: `Search: ${trimmed}`,
      onRemove: onClearSearch,
    },
  ];
}

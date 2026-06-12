import type { FilterChipItem } from "@/components/layouts/filters/FilterChipList";
import { isCompanyIncludeExcludeFacet } from "@/lib/companyIncludeExcludeFacets";
import {
  formatCompanyRangeBucketLabel,
  isCompanyRangeBucketFacet,
} from "@/lib/companyRangeBuckets";
import { isContactIncludeExcludeFacet } from "@/lib/contactIncludeExcludeFacets";

export type EntityFilterChip = FilterChipItem;

/** Active-value chips for one facet block (include / exclude / keyword). */
export function buildFacetSectionChips(
  filterKey: string,
  displayName: string,
  facetValues: Record<string, string[]>,
  excludedFacetValues: Record<string, string[]>,
  onFacetChange: (key: string, values: string[]) => void,
  onExcludedFacetChange?: (key: string, values: string[]) => void,
  options?: {
    includeExclude?: boolean;
  },
): EntityFilterChip[] {
  const out: EntityFilterChip[] = [];
  const included = facetValues[filterKey] ?? [];
  const excluded = excludedFacetValues[filterKey] ?? [];
  const useIncludeExclude =
    options?.includeExclude ??
    (isContactIncludeExcludeFacet(filterKey) ||
      isCompanyIncludeExcludeFacet(filterKey));
  const includePrefix = useIncludeExclude ? "Include " : "";

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

export function buildSearchChip(
  search: string,
  onClearSearch: () => void,
  labelPrefix = "Search",
): EntityFilterChip[] {
  const trimmed = search.trim();
  if (!trimmed) return [];
  return [
    {
      key: "search",
      label: `${labelPrefix}: ${trimmed}`,
      onRemove: onClearSearch,
    },
  ];
}

export type GlobalChipInput = {
  search?: string;
  onClearSearch?: () => void;
  searchLabelPrefix?: string;
  facetValues: Record<string, string[]>;
  excludedFacetValues?: Record<string, string[]>;
  filterSections: Array<{ filterKey: string; displayName: string }>;
  onFacetChange: (key: string, values: string[]) => void;
  onExcludedFacetChange?: (key: string, values: string[]) => void;
  advancedVqlRuleCount?: number;
  onClearVql?: () => void;
  sortChipLabel?: string | null;
  onClearSort?: () => void;
  hiddenColumnCount?: number;
  visibleColumnCount?: number;
  onResetVisibleColumns?: () => void;
  activeTab?: string;
  onClearActiveTab?: () => void;
  activeTabLabels?: Record<string, string>;
  viewChipLabel?: string | null;
  onClearView?: () => void;
};

/** Build global summary chip row for entity filter sidebars. */
export function buildGlobalFilterChips(
  input: GlobalChipInput,
): EntityFilterChip[] {
  const out: EntityFilterChip[] = [];

  if (input.search?.trim() && input.onClearSearch) {
    out.push(
      ...buildSearchChip(
        input.search,
        input.onClearSearch,
        input.searchLabelPrefix ?? "Search",
      ),
    );
  }

  if (
    input.activeTab &&
    input.activeTab !== "total" &&
    input.onClearActiveTab
  ) {
    const label = input.activeTabLabels?.[input.activeTab] ?? input.activeTab;
    out.push({
      key: "list-scope",
      label: `List: ${label}`,
      onRemove: input.onClearActiveTab,
    });
  }

  for (const section of input.filterSections) {
    const key = section.filterKey;
    const included = input.facetValues[key] ?? [];
    const excluded = input.excludedFacetValues?.[key] ?? [];
    const useIncludeExclude =
      isContactIncludeExcludeFacet(key) || isCompanyIncludeExcludeFacet(key);
    const useRange = isCompanyRangeBucketFacet(key);

    if (included.length > 0) {
      const prefix = useIncludeExclude || useRange ? "Include " : "";
      const summary =
        included.length === 1
          ? `${prefix}${section.displayName}: ${
              useRange
                ? formatCompanyRangeBucketLabel(key, included[0]!)
                : included[0]
            }`
          : `${prefix}${section.displayName}: ${included.length} selected`;
      out.push({
        key: `facet-include-${key}`,
        label: summary,
        onRemove: () => input.onFacetChange(key, []),
      });
    }

    if (excluded.length > 0 && input.onExcludedFacetChange) {
      const summary =
        excluded.length === 1
          ? `Exclude ${section.displayName}: ${
              useRange
                ? formatCompanyRangeBucketLabel(key, excluded[0]!)
                : excluded[0]
            }`
          : `Exclude ${section.displayName}: ${excluded.length} selected`;
      out.push({
        key: `facet-exclude-${key}`,
        label: summary,
        onRemove: () => input.onExcludedFacetChange!(key, []),
      });
    }
  }

  if (
    input.advancedVqlRuleCount &&
    input.advancedVqlRuleCount > 0 &&
    input.onClearVql
  ) {
    out.push({
      key: "vql",
      label:
        input.advancedVqlRuleCount === 1
          ? "Advanced: 1 rule"
          : `Advanced: ${input.advancedVqlRuleCount} rules`,
      onRemove: input.onClearVql,
    });
  }

  if (input.sortChipLabel && input.onClearSort) {
    out.push({
      key: "sort-chip",
      label: input.sortChipLabel,
      onRemove: input.onClearSort,
    });
  }

  if (input.viewChipLabel && input.onClearView) {
    out.push({
      key: "view-chip",
      label: input.viewChipLabel,
      onRemove: input.onClearView,
    });
  }

  if (
    input.hiddenColumnCount &&
    input.hiddenColumnCount > 0 &&
    input.onResetVisibleColumns &&
    input.visibleColumnCount != null
  ) {
    out.push({
      key: "cols-chip",
      label: `Columns: ${input.visibleColumnCount} visible`,
      onRemove: input.onResetVisibleColumns,
    });
  }

  return out;
}

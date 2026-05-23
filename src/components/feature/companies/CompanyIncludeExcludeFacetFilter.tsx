"use client";

import { FilterCombobox } from "@/components/ui/FilterCombobox";
import type { CompanyFilterSection } from "@/hooks/useCompanyFilters";

export interface CompanyIncludeExcludeFacetFilterProps {
  section: CompanyFilterSection;
  includeLabel: string;
  excludeLabel: string;
  includedValues: string[];
  excludedValues: string[];
  onIncludedChange: (values: string[]) => void;
  onExcludedChange: (values: string[]) => void;
  onSectionExpand: (key: string) => void;
  onLoadMoreFacet: (key: string) => void;
  setFacetSearch: (key: string, text: string) => void;
}

/** Facet with include/exclude dropdowns and per-value company counts in brackets. */
export function CompanyIncludeExcludeFacetFilter({
  section,
  includeLabel,
  excludeLabel,
  includedValues,
  excludedValues,
  onIncludedChange,
  onExcludedChange,
  onSectionExpand,
  onLoadMoreFacet,
  setFacetSearch,
}: CompanyIncludeExcludeFacetFilterProps) {
  const key = section.filterKey;
  const comboboxProps = {
    options: section.options,
    loading: section.loading,
    loadingMore: section.loadingMore,
    hasMore: section.hasMore,
    onOpen: () => onSectionExpand(key),
    onLoadMore: () => onLoadMoreFacet(key),
    searchText: section.searchText,
    onSearchChange: (text: string) => setFacetSearch(key, text),
  };

  return (
    <div className="c360-space-y-3">
      <FilterCombobox
        label={includeLabel}
        selectedValues={includedValues}
        onSelectionChange={onIncludedChange}
        {...comboboxProps}
      />
      <FilterCombobox
        label={excludeLabel}
        selectedValues={excludedValues}
        onSelectionChange={onExcludedChange}
        {...comboboxProps}
      />
    </div>
  );
}

"use client";

import { FilterCombobox } from "@/components/ui/FilterCombobox";
import type { CompanyFilterSection } from "@/hooks/useCompanyFilters";
import {
  formatCompanyRangeBucketLabel,
  isCompanyRangeBucketFacet,
  normalizeCompanyRangeBucketId,
} from "@/lib/companyRangeBuckets";

export interface CompanyRangeBucketFacetFilterProps {
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

/** Revenue, funding, and employees-count fixed ranges with company counts per bucket. */
export function CompanyRangeBucketFacetFilter({
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
}: CompanyRangeBucketFacetFilterProps) {
  const key = section.filterKey;
  if (!isCompanyRangeBucketFacet(key)) {
    return null;
  }

  const options = section.options.map((o) => {
    const value = normalizeCompanyRangeBucketId(key, String(o.value));
    return {
      ...o,
      value,
      displayValue: formatCompanyRangeBucketLabel(key, value),
    };
  });
  const normalizeSelection = (values: string[]) =>
    values.map((v) => normalizeCompanyRangeBucketId(key, v));

  const comboboxProps = {
    options,
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
        selectedValues={includedValues.map((v) =>
          normalizeCompanyRangeBucketId(key, v),
        )}
        onSelectionChange={(values) =>
          onIncludedChange(normalizeSelection(values))
        }
        {...comboboxProps}
      />
      <FilterCombobox
        label={excludeLabel}
        selectedValues={excludedValues.map((v) =>
          normalizeCompanyRangeBucketId(key, v),
        )}
        onSelectionChange={(values) =>
          onExcludedChange(normalizeSelection(values))
        }
        {...comboboxProps}
      />
    </div>
  );
}

"use client";

import { FilterCombobox } from "@/components/ui/FilterCombobox";
import type { CompanyFilterSection } from "@/hooks/useCompanyFilters";
import {
  formatCompanyRangeBucketLabel,
  isCompanyRangeBucketFacet,
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

  const options = section.options.map((o) => ({
    ...o,
    displayValue: formatCompanyRangeBucketLabel(key, String(o.value)),
  }));
  // #region agent log
  if (key === "company_employees_count" && options.length > 0) {
    globalThis
      .fetch(
        "http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "c73258",
          },
          body: JSON.stringify({
            sessionId: "c73258",
            runId: "emp-bucket",
            hypothesisId: "EB2",
            location:
              "CompanyRangeBucketFacetFilter.tsx:employees_count options",
            message: "facet dropdown bucket labels",
            data: {
              values: options.slice(0, 3).map((o) => ({
                value: o.value,
                displayValue: o.displayValue,
              })),
            },
            timestamp: Date.now(),
          }),
        },
      )
      .catch(() => {});
  }
  // #endregion

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

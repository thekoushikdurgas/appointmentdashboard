"use client";

import { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/Input";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import {
  COMPANY_COHORT_FACET_KEYS,
  isCompanyCohortActive,
} from "@/lib/hireSignalCompanyCohortVql";
import { useCompanyFilters } from "@/hooks/useCompanyFilters";

export type HiringSignalsCompanyFilterSectionProps = {
  companyCohortResolving?: boolean;
  companyCohortMatchTotal?: number | null;
  companyCohortTruncated?: boolean;
};

export function HiringSignalsCompanyFilterSection({
  companyCohortResolving = false,
  companyCohortMatchTotal = null,
  companyCohortTruncated = false,
}: HiringSignalsCompanyFilterSectionProps) {
  const { draft, onCompanyNameSearchChange, onCompanyFacetChange } =
    useHireSignalFilter();

  const {
    sections: allCompanySections,
    loadFilterData,
    loadMoreFilterData,
    setFilterSearch,
  } = useCompanyFilters();

  const cohortSections = useMemo(
    () =>
      allCompanySections.filter((s) =>
        COMPANY_COHORT_FACET_KEYS.has(s.filterKey),
      ),
    [allCompanySections],
  );

  const facetCount = useMemo(() => {
    let n = 0;
    for (const vals of Object.values(draft.companyFacetValues)) {
      n += vals.filter((v) => String(v).trim()).length;
    }
    return n;
  }, [draft.companyFacetValues]);

  const sectionCount =
    (draft.companyNameSearch.trim() ? 1 : 0) + facetCount;

  const onSectionExpand = useCallback(
    (filterKey: string) => {
      void loadFilterData(filterKey);
    },
    [loadFilterData],
  );

  const cohortActive = isCompanyCohortActive(draft);

  return (
    <ContactsCollapsibleFilterSection
      title="Company filters"
      count={sectionCount}
      defaultOpen={cohortActive}
      onClear={
        cohortActive
          ? () => {
              onCompanyNameSearchChange("");
              for (const s of cohortSections) {
                onCompanyFacetChange(s.filterKey, []);
              }
            }
          : undefined
      }
    >
      <div className="c360-space-y-3">
        <p className="c360-text-xs c360-text-muted">
          Match Connectra company records, then filter jobs by linked company
          UUID. Separate from employer name on the job posting.
        </p>
        {companyCohortResolving ? (
          <p className="c360-text-xs c360-text-muted" role="status">
            Resolving matching companies…
          </p>
        ) : null}
        {!companyCohortResolving &&
        cohortActive &&
        typeof companyCohortMatchTotal === "number" ? (
          <p className="c360-text-xs c360-text-muted" role="status">
            {companyCohortMatchTotal.toLocaleString()} matching{" "}
            {companyCohortMatchTotal === 1 ? "company" : "companies"}
            {companyCohortTruncated ? " (list capped)" : ""}
          </p>
        ) : null}

        <Input
          id="hs-company-cohort-name"
          type="search"
          placeholder="Company name"
          value={draft.companyNameSearch}
          onChange={(e) => onCompanyNameSearchChange(e.target.value)}
          className="c360-w-full"
          inputSize="md"
        />

        {cohortSections.map((section) => {
          const vals = draft.companyFacetValues[section.filterKey] ?? [];
          return (
            <FilterCombobox
              key={section.filterKey}
              label={section.displayName}
              options={section.options}
              selectedValues={vals}
              onSelectionChange={(next) =>
                onCompanyFacetChange(section.filterKey, next)
              }
              loading={section.loading}
              loadingMore={section.loadingMore}
              hasMore={section.hasMore}
              onOpen={() => onSectionExpand(section.filterKey)}
              onLoadMore={() => loadMoreFilterData(section.filterKey)}
              searchText={section.searchText}
              onSearchChange={(text) =>
                setFilterSearch(section.filterKey, text)
              }
            />
          );
        })}
      </div>
    </ContactsCollapsibleFilterSection>
  );
}

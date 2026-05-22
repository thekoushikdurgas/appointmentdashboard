"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/Input";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import { useCompanyFilters } from "@/hooks/useCompanyFilters";
import { useCompanyFilterOptions } from "@/hooks/useCompanyFilterOptions";
import {
  HIRE_SIGNAL_COMPANY_COHORT_SECTIONS,
  isCompanyCohortActive,
} from "@/lib/hireSignalCompanyCohort";

function companyFilterHasMore(st: {
  loading: boolean;
  loadingMore: boolean;
  canLoadMore: boolean;
}): boolean {
  if (st.loading || st.loadingMore) return false;
  return st.canLoadMore;
}

export interface HiringSignalsCompanyFiltersProps {
  companyCohortResolving?: boolean;
  companyCohortMatchTotal?: number | null;
  companyCohortTruncated?: boolean;
}

export function HiringSignalsCompanyFilters({
  companyCohortResolving = false,
  companyCohortMatchTotal = null,
  companyCohortTruncated = false,
}: HiringSignalsCompanyFiltersProps) {
  const { draft, onDraftField, onCompanyFacetChange } = useHireSignalFilter();
  const { filtersLoading, loadFilterData, loadMoreFilterData, setFilterSearch } =
    useCompanyFilters();
  const { getState } = useCompanyFilterOptions();

  const cohortActive = isCompanyCohortActive(draft);

  const facetSections = useMemo(
    () =>
      HIRE_SIGNAL_COMPANY_COHORT_SECTIONS.map((def) => {
        const st = getState(def.filterKey);
        return {
          ...def,
          options: st.items,
          loading: st.loading,
          loadingMore: st.loadingMore,
          hasMore: companyFilterHasMore(st),
          searchText: st.searchText,
        };
      }),
    [getState],
  );

  return (
    <>
      <h3 className="c360-hs-filters__group-header">Company filters</h3>
      {companyCohortResolving ? (
        <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
          Resolving companies…
        </p>
      ) : null}
      {!companyCohortResolving &&
      cohortActive &&
      companyCohortMatchTotal != null ? (
        <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
          {companyCohortMatchTotal.toLocaleString()} companies match
          {companyCohortTruncated
            ? " (UUID list capped — narrow filters for full coverage)"
            : ""}
        </p>
      ) : null}

      <ContactsCollapsibleFilterSection
        title="Company name"
        count={draft.companyNameSearch.trim() ? 1 : 0}
        defaultOpen
        onClear={
          draft.companyNameSearch.trim()
            ? () => onDraftField("companyNameSearch", "")
            : undefined
        }
      >
        <Input
          id="hsf-company-name-search"
          className="c360-w-full"
          value={draft.companyNameSearch}
          onChange={(e) => onDraftField("companyNameSearch", e.target.value)}
          placeholder="Search company name"
          inputSize="sm"
        />
      </ContactsCollapsibleFilterSection>

      {filtersLoading ? (
        <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
          Loading filter options…
        </p>
      ) : null}

      {facetSections.map((section) => {
        const vals = draft.companyFacetValues[section.filterKey] ?? [];
        const has = vals.length > 0;
        return (
          <ContactsCollapsibleFilterSection
            key={section.filterKey}
            title={section.title}
            count={has ? vals.length : 0}
            defaultOpen={has || section.filterKey === "industries"}
            onClear={
              has ? () => onCompanyFacetChange(section.filterKey, []) : undefined
            }
          >
            <FilterCombobox
              label={section.title}
              options={section.options}
              selectedValues={vals}
              onSelectionChange={(next) =>
                onCompanyFacetChange(section.filterKey, next)
              }
              loading={section.loading}
              loadingMore={section.loadingMore}
              hasMore={section.hasMore}
              onOpen={() => loadFilterData(section.filterKey)}
              onLoadMore={() => loadMoreFilterData(section.filterKey)}
              searchText={section.searchText}
              onSearchChange={(text) =>
                setFilterSearch(section.filterKey, text)
              }
            />
          </ContactsCollapsibleFilterSection>
        );
      })}
    </>
  );
}

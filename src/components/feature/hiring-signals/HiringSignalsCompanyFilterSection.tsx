"use client";

import { useMemo } from "react";
import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import { Input } from "@/components/ui/Input";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import { useCompanyFilters } from "@/hooks/useCompanyFilters";
import { COMPANY_COHORT_FACET_KEYS } from "@/lib/companyCohortVql";

export interface HiringSignalsCompanyFilterSectionProps {
  companyCohortMatchTotal?: number | null;
  companyCohortTruncated?: boolean;
  companyCohortResolving?: boolean;
}

export function HiringSignalsCompanyFilterSection({
  companyCohortMatchTotal = null,
  companyCohortTruncated = false,
  companyCohortResolving = false,
}: HiringSignalsCompanyFilterSectionProps) {
  const { draft, onCompanyFacetChange, onCompanyNameSearchChange } =
    useHireSignalFilter();

  const {
    sections: allSections,
    loadFilterData,
    loadMoreFilterData,
    setFilterSearch,
  } = useCompanyFilters();

  const sections = useMemo(
    () =>
      allSections.filter(
        (s) =>
          COMPANY_COHORT_FACET_KEYS.has(s.filterKey) && s.filterKey !== "name",
      ),
    [allSections],
  );

  const facetActiveCount = useMemo(() => {
    let n = draft.companyNameSearch.trim() ? 1 : 0;
    for (const s of sections) {
      const vals = draft.companyFacetValues[s.filterKey] ?? [];
      if (vals.length > 0) n += 1;
    }
    return n;
  }, [draft.companyNameSearch, draft.companyFacetValues, sections]);

  const cohortHint =
    companyCohortResolving
      ? "Matching companies…"
      : companyCohortMatchTotal != null
        ? companyCohortTruncated
          ? `${companyCohortMatchTotal.toLocaleString()} companies matched (UUID list capped)`
          : `${companyCohortMatchTotal.toLocaleString()} companies matched`
        : null;

  return (
    <>
      <h3 className="c360-hs-filters__group-header">Company filters</h3>
      <p className="c360-hs-filters__group-hint c360-text-2xs c360-text-ink-muted">
        Firmographics from Connectra. Jobs are limited to postings linked to
        matching company records.
      </p>

      <ContactsCollapsibleFilterSection
        title="Company name"
        count={draft.companyNameSearch.trim() ? 1 : 0}
        defaultOpen
        onClear={
          draft.companyNameSearch.trim()
            ? () => onCompanyNameSearchChange("")
            : undefined
        }
      >
        <Input
          id="hsf-company-name-search"
          type="search"
          placeholder="Search company name…"
          value={draft.companyNameSearch}
          onChange={(e) => onCompanyNameSearchChange(e.target.value)}
          fullWidth
          inputSize="md"
        />
      </ContactsCollapsibleFilterSection>

      {sections.map((section) => {
        const vals = draft.companyFacetValues[section.filterKey] ?? [];
        const has = vals.length > 0;
        return (
          <ContactsCollapsibleFilterSection
            key={section.filterKey}
            title={section.displayName}
            count={has ? vals.length : 0}
            defaultOpen={has}
            onClear={
              has
                ? () => onCompanyFacetChange(section.filterKey, [])
                : undefined
            }
          >
            <FilterCombobox
              label={section.displayName}
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
              onSearchChange={(text) => setFilterSearch(section.filterKey, text)}
            />
          </ContactsCollapsibleFilterSection>
        );
      })}

      {cohortHint ? (
        <p
          className="c360-hs-filters__cohort-hint c360-text-2xs c360-text-ink-muted"
          aria-live="polite"
        >
          {cohortHint}
        </p>
      ) : null}

      {facetActiveCount > 0 ? (
        <button
          type="button"
          className="c360-hs-filters__clear-cohort c360-text-2xs"
          onClick={() => {
            onCompanyNameSearchChange("");
            for (const s of sections) {
              onCompanyFacetChange(s.filterKey, []);
            }
          }}
        >
          Clear company filters
        </button>
      ) : null}
    </>
  );
}

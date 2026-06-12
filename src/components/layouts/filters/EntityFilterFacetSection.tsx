"use client";

import type { ReactNode } from "react";
import { FilterAccordionSection } from "@/components/layouts/filters/FilterAccordionSection";
import { CompanyIncludeExcludeFacetFilter } from "@/components/feature/companies/CompanyIncludeExcludeFacetFilter";
import { CompanyRangeBucketFacetFilter } from "@/components/feature/companies/CompanyRangeBucketFacetFilter";
import { ContactIncludeExcludeFacetFilter } from "@/components/feature/contacts/ContactIncludeExcludeFacetFilter";
import type { CompanyFilterSection } from "@/hooks/useCompanyFilters";
import type { FilterSection } from "@/hooks/useContactFilters";
import { Input } from "@/components/ui/Input";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import { companyFacetComboboxLabels } from "@/lib/companyIncludeExcludeFacets";
import { isCompanyIncludeExcludeFacet } from "@/lib/companyIncludeExcludeFacets";
import {
  companyRangeBucketComboboxLabels,
  isCompanyRangeBucketFacet,
} from "@/lib/companyRangeBuckets";
import { contactFacetComboboxLabels } from "@/lib/contactIncludeExcludeFacets";
import { isContactIncludeExcludeFacet } from "@/lib/contactIncludeExcludeFacets";
import {
  buildFacetSectionChips,
  buildSearchChip,
} from "@/lib/entityFilterChips";

export type EntityFilterFacetSectionProps = {
  entity: "company" | "contact";
  section: (CompanyFilterSection | FilterSection) & { sectionId: string };
  facetValues: Record<string, string[]>;
  excludedFacetValues: Record<string, string[]>;
  onFacetChange: (key: string, values: string[]) => void;
  onExcludedFacetChange?: (key: string, values: string[]) => void;
  onSectionExpand: (key: string) => void;
  onLoadMoreFacet: (key: string) => void;
  setFacetSearch: (key: string, text: string) => void;
  /** Contact email search bound to sidebar `search` state. */
  emailSearch?: string;
  onEmailSearchChange?: (value: string) => void;
};

export function EntityFilterFacetSection({
  entity,
  section,
  facetValues,
  excludedFacetValues,
  onFacetChange,
  onExcludedFacetChange,
  onSectionExpand,
  onLoadMoreFacet,
  setFacetSearch,
  emailSearch = "",
  onEmailSearchChange,
}: EntityFilterFacetSectionProps): ReactNode {
  const key = section.filterKey;
  const useRangeBuckets =
    isCompanyRangeBucketFacet(key) && onExcludedFacetChange != null;
  const useIncludeExclude =
    entity === "company"
      ? isCompanyIncludeExcludeFacet(key) && onExcludedFacetChange != null
      : isContactIncludeExcludeFacet(key) && onExcludedFacetChange != null;

  const included = facetValues[key] ?? [];
  const excluded = excludedFacetValues[key] ?? [];
  const isEmailFacet = key === "email";
  const hasEmailSearch = isEmailFacet && emailSearch.trim().length > 0;
  const active =
    useRangeBuckets || useIncludeExclude
      ? included.length + excluded.length
      : included.length + (hasEmailSearch ? 1 : 0);

  const sectionChips = [
    ...(isEmailFacet && onEmailSearchChange
      ? buildSearchChip(emailSearch, () => onEmailSearchChange(""), "Search")
      : []),
    ...buildFacetSectionChips(
      key,
      section.displayName,
      facetValues,
      excludedFacetValues,
      onFacetChange,
      onExcludedFacetChange,
      {
        includeExclude: useIncludeExclude,
      },
    ),
  ];

  const clearSection = () => {
    onFacetChange(key, []);
    onExcludedFacetChange?.(key, []);
    if (hasEmailSearch && onEmailSearchChange) onEmailSearchChange("");
  };

  if (useRangeBuckets) {
    const { include: includeLabel, exclude: excludeLabel } =
      companyRangeBucketComboboxLabels(key);
    return (
      <FilterAccordionSection
        sectionId={section.sectionId}
        title={section.displayName}
        filterKey={key}
        count={active}
        activeChips={sectionChips}
        onClear={active > 0 ? clearSection : undefined}
      >
        <CompanyRangeBucketFacetFilter
          section={section as CompanyFilterSection}
          includeLabel={includeLabel}
          excludeLabel={excludeLabel}
          includedValues={included}
          excludedValues={excluded}
          onIncludedChange={(next) => onFacetChange(key, next)}
          onExcludedChange={(next) => onExcludedFacetChange!(key, next)}
          onSectionExpand={onSectionExpand}
          onLoadMoreFacet={onLoadMoreFacet}
          setFacetSearch={setFacetSearch}
        />
      </FilterAccordionSection>
    );
  }

  if (useIncludeExclude) {
    const labels =
      entity === "company"
        ? companyFacetComboboxLabels(key, section.displayName)
        : contactFacetComboboxLabels(key, section.displayName);
    const FacetFilter =
      entity === "company"
        ? CompanyIncludeExcludeFacetFilter
        : ContactIncludeExcludeFacetFilter;
    return (
      <FilterAccordionSection
        sectionId={section.sectionId}
        title={section.displayName}
        filterKey={key}
        count={active}
        activeChips={sectionChips}
        onClear={active > 0 ? clearSection : undefined}
      >
        <FacetFilter
          section={section as CompanyFilterSection & FilterSection}
          includeLabel={labels.include}
          excludeLabel={labels.exclude}
          includedValues={included}
          excludedValues={excluded}
          onIncludedChange={(next) => onFacetChange(key, next)}
          onExcludedChange={(next) => onExcludedFacetChange!(key, next)}
          onSectionExpand={onSectionExpand}
          onLoadMoreFacet={onLoadMoreFacet}
          setFacetSearch={setFacetSearch}
        />
      </FilterAccordionSection>
    );
  }

  const vals = facetValues[key] ?? [];
  return (
    <FilterAccordionSection
      sectionId={section.sectionId}
      title={section.displayName}
      filterKey={key}
      count={active > 0 ? active : 0}
      activeChips={sectionChips}
      onClear={active > 0 ? clearSection : undefined}
    >
      {isEmailFacet && onEmailSearchChange ? (
        <div className="c360-contacts-filters__email-search">
          <Input
            type="search"
            value={emailSearch}
            onChange={(e) => onEmailSearchChange(e.target.value)}
            placeholder="Search by email…"
            aria-label="Search contacts"
            className="c360-contacts-filters__search-input"
          />
        </div>
      ) : null}
      <FilterCombobox
        label={section.displayName}
        options={section.options ?? []}
        selectedValues={vals}
        onSelectionChange={(next) => onFacetChange(key, next)}
        loading={section.loading}
        loadingMore={section.loadingMore}
        hasMore={section.hasMore}
        onOpen={() => onSectionExpand(key)}
        onLoadMore={() => onLoadMoreFacet(key)}
        searchText={section.searchText}
        onSearchChange={(text) => setFacetSearch(key, text)}
      />
    </FilterAccordionSection>
  );
}

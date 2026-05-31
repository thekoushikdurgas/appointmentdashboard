"use client";

import { useCallback, useMemo } from "react";
import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import {
  buildEmailSearchChip,
  buildFacetSectionChips,
  type ContactFilterChip,
} from "@/components/feature/contacts/contactFilterSectionChips";
import { FilterSectionChips } from "@/components/feature/contacts/FilterSectionChips";
import { ContactFilterSortSelect } from "@/components/feature/contacts/ContactFilterBar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import { X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import type { FilterSection } from "@/hooks/useContactFilters";
import { ContactIncludeExcludeFacetFilter } from "@/components/feature/contacts/ContactIncludeExcludeFacetFilter";
import { CompanyRangeBucketFacetFilter } from "@/components/feature/companies/CompanyRangeBucketFacetFilter";
import {
  contactFacetComboboxLabels,
  isContactIncludeExcludeFacet,
} from "@/lib/contactIncludeExcludeFacets";
import {
  companyRangeBucketComboboxLabels,
  isCompanyRangeBucketFacet,
} from "@/lib/companyRangeBuckets";
import {
  CONTACTS_DT_COLUMN_IDS,
  CONTACTS_DT_COLUMN_LABELS,
  type ContactsDataTableColumnId,
} from "@/components/feature/contacts/ContactsDataTable";

const VIEW_MODE_OPTIONS = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

export interface ContactsFilterSidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  filterSections: FilterSection[];
  filtersLoading?: boolean;
  filtersError?: string | null;
  facetValues: Record<string, string[]>;
  excludedFacetValues?: Record<string, string[]>;
  onFacetChange: (key: string, values: string[]) => void;
  onExcludedFacetChange?: (key: string, values: string[]) => void;
  /** Load first page of options when a facet combobox opens. */
  onSectionExpand: (key: string) => void;
  /** Append next page when the facet list is scrolled to the end. */
  onLoadMoreFacet: (key: string) => void;
  /** Debounced search within facet options. */
  setFacetSearch: (key: string, text: string) => void;
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  /** Rules from the advanced VQL modal only (not sidebar/tab/facet). */
  advancedVqlRuleCount: number;
  onClearVql: () => void;
  onOpenAdvanced: () => void;
  visibleColumns: ContactsDataTableColumnId[];
  onToggleColumn: (id: ContactsDataTableColumnId) => void;
  /** Non-null when sort differs from default — label for chip. */
  sortChipLabel?: string | null;
  hiddenColumnCount: number;
  onResetVisibleColumns: () => void;
  /** Mobile drawer: close control + `id` for `aria-labelledby` on dialog. */
  filterDrawerTitleId?: string;
  onCloseDrawer?: () => void;
  /** Table row density — mirrors the toolbar view-mode select. */
  tableDensity?: "comfortable" | "compact";
  onTableDensityChange?: (density: "comfortable" | "compact") => void;
}

export function ContactsFilterSidebar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  filterSections,
  filtersLoading = false,
  filtersError = null,
  facetValues,
  excludedFacetValues = {},
  onFacetChange,
  onExcludedFacetChange,
  onSectionExpand,
  onLoadMoreFacet,
  setFacetSearch,
  activeTab,
  onActiveTabChange,
  advancedVqlRuleCount,
  onClearVql,
  onOpenAdvanced,
  visibleColumns,
  onToggleColumn,
  sortChipLabel,
  hiddenColumnCount,
  onResetVisibleColumns,
  filterDrawerTitleId,
  onCloseDrawer,
  tableDensity = "comfortable",
  onTableDensityChange,
}: ContactsFilterSidebarProps) {
  const facetActiveCount = useMemo(() => {
    const keys = new Set([
      ...Object.keys(facetValues),
      ...Object.keys(excludedFacetValues),
    ]);
    let n = 0;
    for (const k of keys) {
      const inc = facetValues[k]?.length ?? 0;
      const exc = excludedFacetValues[k]?.length ?? 0;
      if (inc > 0 || exc > 0) n += 1;
    }
    return n;
  }, [facetValues, excludedFacetValues]);

  /** Tab + facets (excludes search / VQL) — email status is a facet via ``email_status``. */
  const listScopeCount = useMemo(() => {
    let n = 0;
    if (activeTab === "net_new" || activeTab === "do_not_contact") n += 1;
    n += facetActiveCount;
    return n;
  }, [activeTab, facetActiveCount]);

  const sortActiveCount = sortBy !== "newest" ? 1 : 0;

  const columnChipActive = hiddenColumnCount > 0 ? 1 : 0;

  const totalActiveCount = useMemo(() => {
    let n = listScopeCount;
    if (search.trim()) n += 1;
    if (advancedVqlRuleCount > 0) n += 1;
    if (sortActiveCount > 0) n += 1;
    n += columnChipActive;
    return n;
  }, [
    listScopeCount,
    search,
    advancedVqlRuleCount,
    sortActiveCount,
    columnChipActive,
  ]);

  const clearFacets = useCallback(() => {
    for (const s of filterSections) {
      onFacetChange(s.filterKey, []);
      onExcludedFacetChange?.(s.filterKey, []);
    }
  }, [filterSections, onFacetChange, onExcludedFacetChange]);

  const clearAll = useCallback(() => {
    onSearchChange("");
    onActiveTabChange("total");
    clearFacets();
    onClearVql();
  }, [clearFacets, onActiveTabChange, onClearVql, onSearchChange]);

  const facetSectionChips = useCallback(
    (filterKey: string, displayName: string): ContactFilterChip[] =>
      buildFacetSectionChips(
        filterKey,
        displayName,
        facetValues,
        excludedFacetValues,
        onFacetChange,
        onExcludedFacetChange,
      ),
    [facetValues, excludedFacetValues, onFacetChange, onExcludedFacetChange],
  );

  const sortSectionChips = useMemo((): ContactFilterChip[] => {
    if (!sortChipLabel) return [];
    return [
      {
        key: "sort-chip",
        label: sortChipLabel,
        onRemove: () => onSortChange("newest"),
      },
    ];
  }, [sortChipLabel, onSortChange]);

  const viewSectionChips = useMemo((): ContactFilterChip[] => {
    if (tableDensity !== "compact") return [];
    return [
      {
        key: "view-compact",
        label: "Compact rows",
        onRemove: () => onTableDensityChange?.("comfortable"),
      },
    ];
  }, [tableDensity, onTableDensityChange]);

  const columnsSectionChips = useMemo((): ContactFilterChip[] => {
    if (hiddenColumnCount <= 0) return [];
    return [
      {
        key: "cols-chip",
        label: `Columns: ${visibleColumns.length} visible`,
        onRemove: onResetVisibleColumns,
      },
    ];
  }, [hiddenColumnCount, visibleColumns.length, onResetVisibleColumns]);

  const advancedSectionChips = useMemo((): ContactFilterChip[] => {
    if (advancedVqlRuleCount <= 0) return [];
    return [
      {
        key: "vql",
        label:
          advancedVqlRuleCount === 1
            ? "Advanced: 1 rule"
            : `Advanced: ${advancedVqlRuleCount} rules`,
        onRemove: onClearVql,
      },
    ];
  }, [advancedVqlRuleCount, onClearVql]);

  return (
    <div className="c360-contacts-filters">
      <div className="c360-contacts-filters__head-row">
        <div className="c360-contacts-filters__head-text">
          <div className="c360-contacts-filters__head">
            <h2
              className="c360-contacts-filters__title"
              id={filterDrawerTitleId}
            >
              Filters
            </h2>
            {totalActiveCount > 0 ? (
              <span className="c360-contacts-filters__head-count" aria-hidden>
                {totalActiveCount}
              </span>
            ) : null}
          </div>
          <p className="c360-contacts-filters__subtitle">
            {totalActiveCount} active
          </p>
        </div>
        <div className="c360-contacts-filters__head-actions">
          {totalActiveCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="c360-contacts-filters__clear-text"
              onClick={clearAll}
            >
              CLEAR
            </Button>
          ) : null}
          {onCloseDrawer ? (
            <button
              type="button"
              className="c360-contacts-filters__icon-btn"
              title="Close filters"
              aria-label="Close filters"
              onClick={onCloseDrawer}
            >
              <X size={18} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <ContactsCollapsibleFilterSection
        title="Sort"
        count={sortActiveCount}
        defaultOpen
        activeChips={sortSectionChips}
        onClear={sortActiveCount > 0 ? () => onSortChange("newest") : undefined}
      >
        <ContactFilterSortSelect sortBy={sortBy} onSortChange={onSortChange} />
      </ContactsCollapsibleFilterSection>

      {onTableDensityChange ? (
        <ContactsCollapsibleFilterSection
          title="View"
          count={tableDensity === "compact" ? 1 : 0}
          defaultOpen={false}
          activeChips={viewSectionChips}
          onClear={() => onTableDensityChange("comfortable")}
        >
          <Select
            id="contacts-view-mode"
            value={tableDensity}
            onChange={(e) =>
              onTableDensityChange(e.target.value as "comfortable" | "compact")
            }
            options={VIEW_MODE_OPTIONS}
            fullWidth
            inputSize="md"
          />
        </ContactsCollapsibleFilterSection>
      ) : null}

      {filtersLoading ? (
        <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
          Loading filter definitions…
        </p>
      ) : null}
      {filtersError ? (
        <p className="c360-mb-2 c360-text-2xs c360-text-danger">
          Could not load filters: {filtersError}
        </p>
      ) : null}
      {!filtersLoading && !filtersError && filterSections.length === 0 ? (
        <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
          No contact filters available. Use refresh above or check the API.
        </p>
      ) : null}

      {!filterSections.some((s) => s.filterKey === "email") ? (
        <ContactsCollapsibleFilterSection
          title="Email"
          count={search.trim() ? 1 : 0}
          defaultOpen={!!search.trim()}
          activeChips={buildEmailSearchChip(search, () => onSearchChange(""))}
          onClear={search.trim() ? () => onSearchChange("") : undefined}
        >
          <div className="c360-contacts-filters__email-search">
            <Input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by email…"
              aria-label="Search contacts"
              className="c360-contacts-filters__search-input"
            />
          </div>
        </ContactsCollapsibleFilterSection>
      ) : null}

      {filterSections.map((section) => {
        const key = section.filterKey;
        const useRangeBuckets =
          isCompanyRangeBucketFacet(key) && onExcludedFacetChange != null;
        const useIncludeExclude =
          isContactIncludeExcludeFacet(key) && onExcludedFacetChange != null;

        if (useRangeBuckets) {
          const included = facetValues[key] ?? [];
          const excluded = excludedFacetValues[key] ?? [];
          const active = included.length + excluded.length;
          const { include: includeLabel, exclude: excludeLabel } =
            companyRangeBucketComboboxLabels(key);
          return (
            <ContactsCollapsibleFilterSection
              key={key}
              title={section.displayName}
              count={active}
              defaultOpen={active > 0}
              activeChips={facetSectionChips(key, section.displayName)}
              onClear={
                active > 0
                  ? () => {
                      onFacetChange(key, []);
                      onExcludedFacetChange(key, []);
                    }
                  : undefined
              }
            >
              <CompanyRangeBucketFacetFilter
                section={section}
                includeLabel={includeLabel}
                excludeLabel={excludeLabel}
                includedValues={included}
                excludedValues={excluded}
                onIncludedChange={(next) => onFacetChange(key, next)}
                onExcludedChange={(next) => onExcludedFacetChange(key, next)}
                onSectionExpand={onSectionExpand}
                onLoadMoreFacet={onLoadMoreFacet}
                setFacetSearch={setFacetSearch}
              />
            </ContactsCollapsibleFilterSection>
          );
        }

        if (useIncludeExclude) {
          const included = facetValues[key] ?? [];
          const excluded = excludedFacetValues[key] ?? [];
          const active = included.length + excluded.length;
          const { include: includeLabel, exclude: excludeLabel } =
            contactFacetComboboxLabels(key, section.displayName);
          return (
            <ContactsCollapsibleFilterSection
              key={key}
              title={section.displayName}
              count={active}
              defaultOpen={active > 0}
              activeChips={facetSectionChips(key, section.displayName)}
              onClear={
                active > 0
                  ? () => {
                      onFacetChange(key, []);
                      onExcludedFacetChange(key, []);
                    }
                  : undefined
              }
            >
              <ContactIncludeExcludeFacetFilter
                section={section}
                includeLabel={includeLabel}
                excludeLabel={excludeLabel}
                includedValues={included}
                excludedValues={excluded}
                onIncludedChange={(next) => onFacetChange(key, next)}
                onExcludedChange={(next) => onExcludedFacetChange(key, next)}
                onSectionExpand={onSectionExpand}
                onLoadMoreFacet={onLoadMoreFacet}
                setFacetSearch={setFacetSearch}
              />
            </ContactsCollapsibleFilterSection>
          );
        }

        const vals = facetValues[key] ?? [];
        const hasFacetValues = vals.length > 0;
        const isEmailFacet = key === "email";
        const hasEmailSearch = isEmailFacet && search.trim().length > 0;
        const sectionActiveCount = vals.length + (hasEmailSearch ? 1 : 0);
        const sectionHasActive = hasFacetValues || hasEmailSearch;
        return (
          <ContactsCollapsibleFilterSection
            key={key}
            title={section.displayName}
            count={sectionActiveCount > 0 ? sectionActiveCount : 0}
            defaultOpen={sectionHasActive}
            activeChips={[
              ...(isEmailFacet
                ? buildEmailSearchChip(search, () => onSearchChange(""))
                : []),
              ...facetSectionChips(key, section.displayName),
            ]}
            onClear={
              sectionHasActive
                ? () => {
                    onFacetChange(key, []);
                    if (hasEmailSearch) onSearchChange("");
                  }
                : undefined
            }
          >
            {isEmailFacet ? (
              <div className="c360-contacts-filters__email-search">
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search by email…"
                  aria-label="Search contacts"
                  className="c360-contacts-filters__search-input"
                />
              </div>
            ) : null}
            <FilterCombobox
              label={section.displayName}
              options={section.options}
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
          </ContactsCollapsibleFilterSection>
        );
      })}

      <ContactsCollapsibleFilterSection
        title="Columns"
        count={hiddenColumnCount}
        defaultOpen={false}
        activeChips={columnsSectionChips}
        onClear={hiddenColumnCount > 0 ? onResetVisibleColumns : undefined}
      >
        <div className="c360-contacts-filters__columns-inner">
          {CONTACTS_DT_COLUMN_IDS.map((id) => (
            <Checkbox
              key={id}
              size="sm"
              label={CONTACTS_DT_COLUMN_LABELS[id]}
              checked={visibleColumns.includes(id)}
              onChange={() => onToggleColumn(id)}
              disabled={
                visibleColumns.includes(id) && visibleColumns.length === 1
              }
            />
          ))}
        </div>
        <p className="c360-contacts-filters__columns-hint c360-text-xs c360-text-muted">
          At least one data column stays visible.
        </p>
      </ContactsCollapsibleFilterSection>

      <div className="c360-contacts-filters__advanced">
        <FilterSectionChips chips={advancedSectionChips} />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="c360-contacts-filters__advanced-btn"
          onClick={onOpenAdvanced}
        >
          {advancedVqlRuleCount > 0
            ? "Edit advanced filter"
            : "Advanced filter"}
        </Button>
        {advancedVqlRuleCount > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClearVql}>
            Clear advanced
          </Button>
        ) : null}
      </div>
    </div>
  );
}

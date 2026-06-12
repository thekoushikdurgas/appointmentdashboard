"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import { FilterAccordionSection } from "@/components/layouts/filters/FilterAccordionSection";
import { EntityFilterFacetSection } from "@/components/layouts/filters/EntityFilterFacetSection";
import { EntityFilterSidebarShell } from "@/components/layouts/filters/EntityFilterSidebarShell";
import { ContactFilterSortSelect } from "@/components/feature/contacts/ContactFilterBar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import type { FilterSection } from "@/hooks/useContactFilters";
import {
  CONTACTS_DT_COLUMN_IDS,
  CONTACTS_DT_COLUMN_LABELS,
  type ContactsDataTableColumnId,
} from "@/components/feature/contacts/ContactsDataTable";
import {
  CONTACT_FILTER_GROUPS,
  CONTACT_FILTER_KEY_TO_SECTION_ID,
  CONTACT_FILTER_SECTION_IDS,
} from "@/lib/contactFilterSectionIds";
import {
  buildGlobalFilterChips,
  buildSearchChip,
} from "@/lib/entityFilterChips";

const VIEW_MODE_OPTIONS = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

const LIST_SCOPE_LABELS: Record<string, string> = {
  net_new: "Net New",
  do_not_contact: "Do Not Contact",
};

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
  onSectionExpand: (key: string) => void;
  onLoadMoreFacet: (key: string) => void;
  setFacetSearch: (key: string, text: string) => void;
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  advancedVqlRuleCount: number;
  onClearVql: () => void;
  onOpenAdvanced: () => void;
  visibleColumns: ContactsDataTableColumnId[];
  onToggleColumn: (id: ContactsDataTableColumnId) => void;
  sortChipLabel?: string | null;
  hiddenColumnCount: number;
  onResetVisibleColumns: () => void;
  filterDrawerTitleId?: string;
  headerActions?: ReactNode;
  tableDensity?: "comfortable" | "compact";
  onTableDensityChange?: (density: "comfortable" | "compact") => void;
  onRefreshFilters?: () => void | Promise<void>;
  filtersRefreshing?: boolean;
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
  headerActions,
  tableDensity = "comfortable",
  onTableDensityChange,
  onRefreshFilters,
  filtersRefreshing = false,
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

  const listScopeCount = useMemo(() => {
    let n = 0;
    if (activeTab === "net_new" || activeTab === "do_not_contact") n += 1;
    n += facetActiveCount;
    return n;
  }, [activeTab, facetActiveCount]);

  const sortActiveCount = sortBy !== "newest" ? 1 : 0;
  const viewActiveCount = tableDensity === "compact" ? 1 : 0;

  const totalActiveCount = useMemo(() => {
    let n = listScopeCount;
    if (search.trim()) n += 1;
    if (advancedVqlRuleCount > 0) n += 1;
    if (sortActiveCount > 0) n += 1;
    if (hiddenColumnCount > 0) n += 1;
    if (viewActiveCount > 0) n += 1;
    return n;
  }, [
    listScopeCount,
    search,
    advancedVqlRuleCount,
    sortActiveCount,
    hiddenColumnCount,
    viewActiveCount,
  ]);

  const clearFacets = useCallback(() => {
    for (const s of filterSections) {
      onFacetChange(s.filterKey, []);
      onExcludedFacetChange?.(s.filterKey, []);
    }
  }, [filterSections, onFacetChange, onExcludedFacetChange]);

  const clearAll = useCallback(() => {
    onSearchChange("");
    onSortChange("newest");
    onActiveTabChange("total");
    onTableDensityChange?.("comfortable");
    clearFacets();
    onClearVql();
  }, [
    clearFacets,
    onActiveTabChange,
    onClearVql,
    onSearchChange,
    onSortChange,
    onTableDensityChange,
  ]);

  const filterSectionsByKey = useMemo(() => {
    const map = new Map<
      string,
      { filterKey: string; displayName: string; sectionId: string }
    >();
    for (const s of filterSections) {
      map.set(s.filterKey, {
        filterKey: s.filterKey,
        displayName: s.displayName,
        sectionId: CONTACT_FILTER_KEY_TO_SECTION_ID[s.filterKey] ?? s.filterKey,
      });
    }
    return map;
  }, [filterSections]);

  const globalChips = useMemo(
    () =>
      buildGlobalFilterChips({
        search,
        onClearSearch: () => onSearchChange(""),
        searchLabelPrefix: "Email",
        facetValues,
        excludedFacetValues,
        filterSections,
        onFacetChange,
        onExcludedFacetChange,
        advancedVqlRuleCount,
        onClearVql,
        sortChipLabel,
        onClearSort: () => onSortChange("newest"),
        hiddenColumnCount,
        visibleColumnCount: visibleColumns.length,
        onResetVisibleColumns,
        activeTab,
        onClearActiveTab: () => onActiveTabChange("total"),
        activeTabLabels: LIST_SCOPE_LABELS,
        viewChipLabel: tableDensity === "compact" ? "Compact rows" : null,
        onClearView:
          tableDensity === "compact"
            ? () => onTableDensityChange?.("comfortable")
            : undefined,
      }),
    [
      search,
      facetValues,
      excludedFacetValues,
      filterSections,
      onFacetChange,
      onExcludedFacetChange,
      advancedVqlRuleCount,
      onClearVql,
      sortChipLabel,
      onSortChange,
      hiddenColumnCount,
      visibleColumns.length,
      onResetVisibleColumns,
      activeTab,
      onActiveTabChange,
      tableDensity,
      onTableDensityChange,
      onSearchChange,
    ],
  );

  const filtersStatus =
    filtersLoading || filtersError || filterSections.length === 0 ? (
      <>
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
      </>
    ) : null;

  const hasEmailFacet = filterSections.some((s) => s.filterKey === "email");
  const emailFallbackActive = !hasEmailFacet && search.trim().length > 0;

  return (
    <EntityFilterSidebarShell
      titleId={filterDrawerTitleId}
      activeCount={totalActiveCount}
      headerActions={headerActions}
      onClear={clearAll}
      onRefreshFilters={onRefreshFilters}
      filtersRefreshing={filtersRefreshing}
      globalChips={globalChips}
      defaultOpenSectionId={CONTACT_FILTER_SECTION_IDS.personTitle}
      filtersStatus={filtersStatus}
      groups={CONTACT_FILTER_GROUPS}
      filterSectionsByKey={filterSectionsByKey}
      metaSections={
        <>
          <FilterAccordionSection
            sectionId={CONTACT_FILTER_SECTION_IDS.sort}
            title="Sort"
            count={sortActiveCount}
            onClear={
              sortActiveCount > 0 ? () => onSortChange("newest") : undefined
            }
          >
            <ContactFilterSortSelect
              sortBy={sortBy}
              onSortChange={onSortChange}
              menuVariant="inline"
            />
          </FilterAccordionSection>
          {onTableDensityChange ? (
            <FilterAccordionSection
              sectionId={CONTACT_FILTER_SECTION_IDS.view}
              title="View"
              count={viewActiveCount}
              onClear={() => onTableDensityChange("comfortable")}
            >
              <Select
                id="contacts-view-mode"
                value={tableDensity}
                onChange={(e) =>
                  onTableDensityChange(
                    e.target.value as "comfortable" | "compact",
                  )
                }
                options={VIEW_MODE_OPTIONS}
                fullWidth
                inputSize="md"
                menuVariant="inline"
              />
            </FilterAccordionSection>
          ) : null}
          {!hasEmailFacet ? (
            <FilterAccordionSection
              sectionId={CONTACT_FILTER_SECTION_IDS.email}
              title="Email"
              count={emailFallbackActive ? 1 : 0}
              activeChips={buildSearchChip(
                search,
                () => onSearchChange(""),
                "Search",
              )}
              onClear={
                emailFallbackActive ? () => onSearchChange("") : undefined
              }
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
            </FilterAccordionSection>
          ) : null}
        </>
      }
      renderFacetSection={(filterKey) => {
        const section = filterSections.find((s) => s.filterKey === filterKey);
        const meta = filterSectionsByKey.get(filterKey);
        if (!section || !meta) return null;
        return (
          <EntityFilterFacetSection
            key={filterKey}
            entity="contact"
            section={{ ...section, sectionId: meta.sectionId }}
            facetValues={facetValues}
            excludedFacetValues={excludedFacetValues}
            onFacetChange={onFacetChange}
            onExcludedFacetChange={onExcludedFacetChange}
            onSectionExpand={onSectionExpand}
            onLoadMoreFacet={onLoadMoreFacet}
            setFacetSearch={setFacetSearch}
            emailSearch={filterKey === "email" ? search : undefined}
            onEmailSearchChange={
              filterKey === "email" ? onSearchChange : undefined
            }
          />
        );
      }}
      columnsSection={
        <FilterAccordionSection
          sectionId={CONTACT_FILTER_SECTION_IDS.columns}
          title="Columns"
          count={hiddenColumnCount}
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
        </FilterAccordionSection>
      }
      advancedSection={
        <div className="c360-contacts-filters__advanced">
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearVql}
            >
              Clear advanced
            </Button>
          ) : null}
        </div>
      }
    />
  );
}

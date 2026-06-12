"use client";

import { useMemo, useCallback, type ReactNode } from "react";
import { FilterAccordionSection } from "@/components/layouts/filters/FilterAccordionSection";
import { EntityFilterFacetSection } from "@/components/layouts/filters/EntityFilterFacetSection";
import { EntityFilterSidebarShell } from "@/components/layouts/filters/EntityFilterSidebarShell";
import { ContactFilterSortSelect } from "@/components/feature/contacts/ContactFilterBar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import type { CompanyFilterSection } from "@/hooks/useCompanyFilters";
import {
  COMPANIES_DT_COLUMN_IDS,
  COMPANIES_DT_COLUMN_LABELS,
  type CompaniesDataTableColumnId,
} from "@/components/feature/companies/companiesTableModel";
import {
  COMPANY_FILTER_GROUPS,
  COMPANY_FILTER_KEY_TO_SECTION_ID,
  COMPANY_FILTER_SECTION_IDS,
} from "@/lib/companyFilterSectionIds";
import { buildGlobalFilterChips } from "@/lib/entityFilterChips";

const VIEW_MODE_OPTIONS = [
  { value: "list", label: "List" },
  { value: "card", label: "Card" },
];

const TABLE_DENSITY_OPTIONS = [
  { value: "comfortable", label: "Comfortable rows" },
  { value: "compact", label: "Compact rows" },
];

export interface CompaniesFilterSidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  filterSections: CompanyFilterSection[];
  filtersLoading?: boolean;
  filtersError?: string | null;
  facetValues: Record<string, string[]>;
  excludedFacetValues?: Record<string, string[]>;
  onFacetChange: (key: string, values: string[]) => void;
  onExcludedFacetChange?: (key: string, values: string[]) => void;
  onSectionExpand: (key: string) => void;
  onLoadMoreFacet: (key: string) => void;
  setFacetSearch: (key: string, text: string) => void;
  advancedVqlRuleCount: number;
  onClearVql: () => void;
  onOpenAdvanced: () => void;
  visibleColumns: CompaniesDataTableColumnId[];
  onToggleColumn: (id: CompaniesDataTableColumnId) => void;
  sortChipLabel?: string | null;
  hiddenColumnCount: number;
  onResetVisibleColumns: () => void;
  onRefreshFilters?: () => void | Promise<void>;
  filtersRefreshing?: boolean;
  drawerTitleId?: string;
  headerActions?: ReactNode;
  viewMode?: "list" | "card";
  onViewModeChange?: (mode: "list" | "card") => void;
  tableDensity?: "comfortable" | "compact";
  onTableDensityChange?: (density: "comfortable" | "compact") => void;
}

export function CompaniesFilterSidebar({
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
  advancedVqlRuleCount,
  onClearVql,
  onOpenAdvanced,
  visibleColumns,
  onToggleColumn,
  sortChipLabel,
  hiddenColumnCount,
  onResetVisibleColumns,
  onRefreshFilters,
  filtersRefreshing = false,
  drawerTitleId = "c360-companies-filter-drawer-title",
  headerActions,
  viewMode = "list",
  onViewModeChange,
  tableDensity = "comfortable",
  onTableDensityChange,
}: CompaniesFilterSidebarProps) {
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

  const sortActiveCount = sortBy !== "newest" ? 1 : 0;
  const viewActiveCount =
    viewMode === "card"
      ? 1
      : viewMode === "list" && tableDensity === "compact"
        ? 1
        : 0;
  const viewChipLabel =
    viewMode === "card"
      ? "Card view"
      : tableDensity === "compact"
        ? "Compact rows"
        : null;

  const totalActiveCount = useMemo(() => {
    let n = facetActiveCount;
    if (search.trim()) n += 1;
    if (advancedVqlRuleCount > 0) n += 1;
    if (sortActiveCount > 0) n += 1;
    if (hiddenColumnCount > 0) n += 1;
    if (viewActiveCount > 0) n += 1;
    return n;
  }, [
    facetActiveCount,
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
    onViewModeChange?.("list");
    onTableDensityChange?.("comfortable");
    clearFacets();
    onClearVql();
  }, [
    clearFacets,
    onClearVql,
    onSearchChange,
    onSortChange,
    onTableDensityChange,
    onViewModeChange,
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
        sectionId: COMPANY_FILTER_KEY_TO_SECTION_ID[s.filterKey] ?? s.filterKey,
      });
    }
    return map;
  }, [filterSections]);

  const globalChips = useMemo(
    () =>
      buildGlobalFilterChips({
        search,
        onClearSearch: () => onSearchChange(""),
        searchLabelPrefix: "Search",
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
        viewChipLabel,
        onClearView:
          viewChipLabel != null
            ? () => {
                onViewModeChange?.("list");
                onTableDensityChange?.("comfortable");
              }
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
      viewChipLabel,
      onViewModeChange,
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
            No company filters available. Use refresh above or check the API.
          </p>
        ) : null}
      </>
    ) : null;

  return (
    <EntityFilterSidebarShell
      className="c360-companies-filters"
      titleId={drawerTitleId}
      activeCount={totalActiveCount}
      headerActions={headerActions}
      onClear={clearAll}
      onRefreshFilters={onRefreshFilters}
      filtersRefreshing={filtersRefreshing}
      globalChips={globalChips}
      defaultOpenSectionId={COMPANY_FILTER_SECTION_IDS.companyName}
      searchSlot={
        <div className="c360-contacts-filters__search">
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search companies…"
            aria-label="Search companies"
            className="c360-contacts-filters__search-input"
          />
        </div>
      }
      filtersStatus={filtersStatus}
      groups={COMPANY_FILTER_GROUPS}
      filterSectionsByKey={filterSectionsByKey}
      metaSections={
        <>
          <FilterAccordionSection
            sectionId={COMPANY_FILTER_SECTION_IDS.sort}
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
          {onViewModeChange ? (
            <FilterAccordionSection
              sectionId={COMPANY_FILTER_SECTION_IDS.view}
              title="View"
              count={viewActiveCount}
              onClear={() => {
                onViewModeChange("list");
                onTableDensityChange?.("comfortable");
              }}
            >
              <Select
                id="companies-view-mode"
                value={viewMode}
                onChange={(e) =>
                  onViewModeChange(e.target.value as "list" | "card")
                }
                options={VIEW_MODE_OPTIONS}
                fullWidth
                inputSize="md"
                menuVariant="inline"
                className="c360-mb-2"
              />
              {viewMode === "list" && onTableDensityChange ? (
                <>
                  <p className="c360-m-0 c360-mb-2 c360-text-2xs c360-text-ink-muted">
                    Row density (list)
                  </p>
                  <Select
                    id="companies-table-density"
                    value={tableDensity}
                    onChange={(e) =>
                      onTableDensityChange(
                        e.target.value as "comfortable" | "compact",
                      )
                    }
                    options={TABLE_DENSITY_OPTIONS}
                    fullWidth
                    inputSize="md"
                    menuVariant="inline"
                  />
                </>
              ) : null}
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
            entity="company"
            section={{ ...section, sectionId: meta.sectionId }}
            facetValues={facetValues}
            excludedFacetValues={excludedFacetValues}
            onFacetChange={onFacetChange}
            onExcludedFacetChange={onExcludedFacetChange}
            onSectionExpand={onSectionExpand}
            onLoadMoreFacet={onLoadMoreFacet}
            setFacetSearch={setFacetSearch}
          />
        );
      }}
      columnsSection={
        <FilterAccordionSection
          sectionId={COMPANY_FILTER_SECTION_IDS.columns}
          title="Columns"
          count={hiddenColumnCount}
        >
          <div className="c360-contacts-filters__columns-inner">
            {COMPANIES_DT_COLUMN_IDS.map((id) => (
              <Checkbox
                key={id}
                size="sm"
                label={COMPANIES_DT_COLUMN_LABELS[id]}
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

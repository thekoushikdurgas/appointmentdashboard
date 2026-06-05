"use client";

import { useMemo, useCallback, type ReactNode } from "react";
import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import { ContactFilterSortSelect } from "@/components/feature/contacts/ContactFilterBar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyFilterSection } from "@/hooks/useCompanyFilters";
import { CompanyIncludeExcludeFacetFilter } from "@/components/feature/companies/CompanyIncludeExcludeFacetFilter";
import { CompanyRangeBucketFacetFilter } from "@/components/feature/companies/CompanyRangeBucketFacetFilter";
import {
  companyFacetComboboxLabels,
  isCompanyIncludeExcludeFacet,
} from "@/lib/companyIncludeExcludeFacets";
import {
  companyRangeBucketComboboxLabels,
  formatCompanyRangeBucketLabel,
  isCompanyRangeBucketFacet,
} from "@/lib/companyRangeBuckets";
import {
  COMPANIES_DT_COLUMN_IDS,
  COMPANIES_DT_COLUMN_LABELS,
  type CompaniesDataTableColumnId,
} from "@/components/feature/companies/companiesTableModel";

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
  const columnChipActive = hiddenColumnCount > 0 ? 1 : 0;

  const totalActiveCount = useMemo(() => {
    let n = facetActiveCount;
    if (search.trim()) n += 1;
    if (advancedVqlRuleCount > 0) n += 1;
    if (sortActiveCount > 0) n += 1;
    n += columnChipActive;
    return n;
  }, [
    facetActiveCount,
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
    onSortChange("newest");
    clearFacets();
    onClearVql();
  }, [clearFacets, onSearchChange, onSortChange, onClearVql]);

  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (search.trim()) {
      out.push({
        key: "search",
        label: `Search: ${search.trim()}`,
        onRemove: () => onSearchChange(""),
      });
    }
    for (const [key, vals] of Object.entries(facetValues)) {
      if (vals != null && vals.length > 0) {
        const section = filterSections.find((s) => s.filterKey === key);
        const label = section?.displayName ?? key;
        const prefix =
          isCompanyIncludeExcludeFacet(key) || isCompanyRangeBucketFacet(key)
            ? "Include "
            : "";
        const summary =
          vals.length === 1
            ? `${prefix}${label}: ${
                isCompanyRangeBucketFacet(key)
                  ? formatCompanyRangeBucketLabel(key, vals[0])
                  : vals[0]
              }`
            : `${prefix}${label}: ${vals.length} selected`;
        out.push({
          key: `facet-include-${key}`,
          label: summary,
          onRemove: () => onFacetChange(key, []),
        });
      }
    }
    for (const [key, vals] of Object.entries(excludedFacetValues)) {
      if (vals != null && vals.length > 0) {
        const section = filterSections.find((s) => s.filterKey === key);
        const label = section?.displayName ?? key;
        const summary =
          vals.length === 1
            ? `Exclude ${label}: ${
                isCompanyRangeBucketFacet(key)
                  ? formatCompanyRangeBucketLabel(key, vals[0])
                  : vals[0]
              }`
            : `Exclude ${label}: ${vals.length} selected`;
        out.push({
          key: `facet-exclude-${key}`,
          label: summary,
          onRemove: () => onExcludedFacetChange?.(key, []),
        });
      }
    }
    if (advancedVqlRuleCount > 0) {
      out.push({
        key: "vql",
        label:
          advancedVqlRuleCount === 1
            ? "Advanced: 1 rule"
            : `Advanced: ${advancedVqlRuleCount} rules`,
        onRemove: onClearVql,
      });
    }
    if (sortChipLabel) {
      out.push({
        key: "sort-chip",
        label: sortChipLabel,
        onRemove: () => onSortChange("newest"),
      });
    }
    if (hiddenColumnCount > 0) {
      out.push({
        key: "cols-chip",
        label: `Columns: ${visibleColumns.length} visible`,
        onRemove: onResetVisibleColumns,
      });
    }
    return out;
  }, [
    search,
    facetValues,
    excludedFacetValues,
    filterSections,
    onExcludedFacetChange,
    advancedVqlRuleCount,
    sortChipLabel,
    hiddenColumnCount,
    visibleColumns.length,
    onSearchChange,
    onFacetChange,
    onClearVql,
    onSortChange,
    onResetVisibleColumns,
  ]);

  return (
    <div className="c360-contacts-filters c360-companies-filters">
      <div className="c360-contacts-filters__head-row">
        <div className="c360-contacts-filters__head-text">
          <div className="c360-contacts-filters__head">
            <h2 id={drawerTitleId} className="c360-contacts-filters__title">
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
          {headerActions}
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
          {onRefreshFilters ? (
            <button
              type="button"
              className="c360-contacts-filters__icon-btn"
              title="Refresh filter definitions"
              aria-label="Refresh filter definitions"
              disabled={filtersRefreshing}
              onClick={() => void onRefreshFilters()}
            >
              <RefreshCw
                size={16}
                className={cn(filtersRefreshing && "c360-spin")}
                aria-hidden
              />
            </button>
          ) : null}
        </div>
      </div>

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

      {chips.length > 0 ? (
        <div
          className="c360-contacts-filters__chips"
          aria-label="Active filters"
        >
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              className="c360-contacts-filters__chip"
              title="Remove filter"
              onClick={c.onRemove}
            >
              <span>{c.label}</span>
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      ) : null}

      <ContactsCollapsibleFilterSection
        title="Sort"
        count={sortActiveCount}
        defaultOpen
        onClear={sortActiveCount > 0 ? () => onSortChange("newest") : undefined}
      >
        <ContactFilterSortSelect
          sortBy={sortBy}
          onSortChange={onSortChange}
          menuVariant="inline"
        />
      </ContactsCollapsibleFilterSection>

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

      {onViewModeChange ? (
        <ContactsCollapsibleFilterSection
          title="View"
          count={
            viewMode === "card"
              ? 1
              : viewMode === "list" && tableDensity === "compact"
                ? 1
                : 0
          }
          defaultOpen={false}
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
        </ContactsCollapsibleFilterSection>
      ) : null}

      {filterSections.map((section) => {
        const key = section.filterKey;
        const useRangeBuckets =
          isCompanyRangeBucketFacet(key) && onExcludedFacetChange != null;
        const useIncludeExclude =
          isCompanyIncludeExcludeFacet(key) && onExcludedFacetChange != null;

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
            companyFacetComboboxLabels(key, section.displayName);
          return (
            <ContactsCollapsibleFilterSection
              key={key}
              title={section.displayName}
              count={active}
              defaultOpen={active > 0}
              onClear={
                active > 0
                  ? () => {
                      onFacetChange(key, []);
                      onExcludedFacetChange(key, []);
                    }
                  : undefined
              }
            >
              <CompanyIncludeExcludeFacetFilter
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
        const has = vals.length > 0;
        return (
          <ContactsCollapsibleFilterSection
            key={key}
            title={section.displayName}
            count={has ? vals.length : 0}
            defaultOpen={has}
            onClear={has ? () => onFacetChange(key, []) : undefined}
          >
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
      </ContactsCollapsibleFilterSection>

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
          <Button type="button" variant="ghost" size="sm" onClick={onClearVql}>
            Clear advanced
          </Button>
        ) : null}
      </div>
    </div>
  );
}

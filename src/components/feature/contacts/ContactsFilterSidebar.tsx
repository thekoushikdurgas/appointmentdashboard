"use client";

import { useCallback, useMemo } from "react";
import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import { ContactFilterSortSelect } from "@/components/feature/contacts/ContactFilterBar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import { Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import {
  EMAIL_STATUS_STATIC_FACET_OPTIONS,
} from "@/lib/contactEmailStatus";
import type { FilterSection } from "@/hooks/useContactFilters";
import type { CompanyFilterSection } from "@/hooks/useCompanyFilters";
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
  facetValues: Record<string, string[]>;
  onFacetChange: (key: string, values: string[]) => void;
  /** Load first page of options when a facet combobox opens. */
  onSectionExpand: (key: string) => void;
  /** Append next page when the facet list is scrolled to the end. */
  onLoadMoreFacet: (key: string) => void;
  /** Debounced search within facet options. */
  setFacetSearch: (key: string, text: string) => void;
  companyFilterSections?: CompanyFilterSection[];
  companyFacetValues?: Record<string, string[]>;
  onCompanyFacetChange?: (key: string, values: string[]) => void;
  onCompanySectionExpand?: (key: string) => void;
  onLoadMoreCompanyFacet?: (key: string) => void;
  setCompanyFacetSearch?: (key: string, text: string) => void;
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
  /** Refetch filter definitions (clears TTL cache). */
  onRefreshFilters?: () => void | Promise<void>;
  filtersRefreshing?: boolean;
  /** Mobile drawer: close control + `id` for `aria-labelledby` on dialog. */
  filterDrawerTitleId?: string;
  onCloseDrawer?: () => void;
  /** Secondary “AI” query line (appointment-d1-style); `aiQuery` is separate from email search when used. */
  aiQuery?: string;
  onAiQueryChange?: (value: string) => void;
  onAiSearch?: () => void;
  aiSearching?: boolean;
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
  facetValues,
  onFacetChange,
  onSectionExpand,
  onLoadMoreFacet,
  setFacetSearch,
  companyFilterSections = [],
  companyFacetValues = {},
  onCompanyFacetChange,
  onCompanySectionExpand,
  onLoadMoreCompanyFacet,
  setCompanyFacetSearch,
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
  onRefreshFilters,
  filtersRefreshing = false,
  filterDrawerTitleId,
  onCloseDrawer,
  aiQuery = "",
  onAiQueryChange,
  onAiSearch,
  aiSearching = false,
  tableDensity = "comfortable",
  onTableDensityChange,
}: ContactsFilterSidebarProps) {
  const facetSectionsWithoutEmailStatus = useMemo(
    () => filterSections.filter((s) => s.filterKey !== "email_status"),
    [filterSections],
  );

  const emailStatusFacetSection = useMemo((): FilterSection => {
    const fromApi = filterSections.find((s) => s.filterKey === "email_status");
    if (fromApi) return fromApi;
    return {
      filterKey: "email_status",
      displayName: "Email status",
      filterType: "keyword",
      options: EMAIL_STATUS_STATIC_FACET_OPTIONS,
      loading: false,
      loadingMore: false,
      hasMore: false,
      searchText: "",
    };
  }, [filterSections]);

  const companyFacetActiveCount = useMemo(
    () =>
      Object.values(companyFacetValues).filter(
        (arr) => Array.isArray(arr) && arr.length > 0,
      ).length,
    [companyFacetValues],
  );

  const facetActiveCount = useMemo(
    () =>
      Object.values(facetValues).filter(
        (arr) => Array.isArray(arr) && arr.length > 0,
      ).length + companyFacetActiveCount,
    [facetValues, companyFacetActiveCount],
  );

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
    }
    if (!filterSections.some((s) => s.filterKey === "email_status")) {
      onFacetChange("email_status", []);
    }
    if (onCompanyFacetChange) {
      for (const s of companyFilterSections) {
        onCompanyFacetChange(s.filterKey, []);
      }
    }
  }, [
    filterSections,
    onFacetChange,
    companyFilterSections,
    onCompanyFacetChange,
  ]);

  const clearAll = useCallback(() => {
    onSearchChange("");
    onActiveTabChange("total");
    clearFacets();
    onClearVql();
  }, [clearFacets, onActiveTabChange, onClearVql, onSearchChange]);

  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (search.trim()) {
      out.push({
        key: "search",
        label: `Search: ${search.trim()}`,
        onRemove: () => onSearchChange(""),
      });
    }
    if (activeTab === "net_new") {
      out.push({
        key: "tab-net",
        label: "Net new (7 days)",
        onRemove: () => onActiveTabChange("total"),
      });
    } else     if (activeTab === "do_not_contact") {
      out.push({
        key: "tab-dnc",
        label: "Do not contact",
        onRemove: () => onActiveTabChange("total"),
      });
    }
    for (const [key, vals] of Object.entries(facetValues)) {
      if (vals != null && vals.length > 0) {
        const section =
          filterSections.find((s) => s.filterKey === key) ??
          (key === "email_status" ? emailStatusFacetSection : undefined);
        const label = section?.displayName ?? key;
        const summary =
          vals.length === 1
            ? `${label}: ${vals[0]}`
            : `${label}: ${vals.length} selected`;
        out.push({
          key: `facet-${key}`,
          label: summary,
          onRemove: () => onFacetChange(key, []),
        });
      }
    }
    for (const [key, vals] of Object.entries(companyFacetValues)) {
      if (vals != null && vals.length > 0 && onCompanyFacetChange) {
        const section = companyFilterSections.find((s) => s.filterKey === key);
        const label = section?.displayName ?? key;
        const summary =
          vals.length === 1
            ? `Company · ${label}: ${vals[0]}`
            : `Company · ${label}: ${vals.length} selected`;
        out.push({
          key: `company-facet-${key}`,
          label: summary,
          onRemove: () => onCompanyFacetChange(key, []),
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
    activeTab,
    facetValues,
    filterSections,
    emailStatusFacetSection,
    companyFacetValues,
    companyFilterSections,
    advancedVqlRuleCount,
    sortChipLabel,
    hiddenColumnCount,
    visibleColumns.length,
    onSearchChange,
    onActiveTabChange,
    onFacetChange,
    onCompanyFacetChange,
    onClearVql,
    onSortChange,
    onResetVisibleColumns,
  ]);

  const showAiRow = Boolean(onAiQueryChange && onAiSearch);

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

      {showAiRow ? (
        <div className="c360-contacts-filters__ai-row">
          <div className="c360-contacts-filters__ai-input-wrap">
            <Sparkles size={16} className="c360-text-muted" aria-hidden />
            <input
              type="text"
              className="c360-contacts-filters__ai-input"
              placeholder="Ask AI: 'VPs in tech with >100 employees'"
              value={aiQuery}
              onChange={(e) => onAiQueryChange?.(e.target.value)}
              aria-label="AI-assisted filter prompt"
            />
            <button
              type="button"
              className="c360-contacts-filters__ai-btn"
              title="Run AI filter"
              aria-label="Run AI filter"
              disabled={aiSearching || !aiQuery.trim()}
              onClick={() => onAiSearch?.()}
            >
              {aiSearching ? (
                <Loader2 size={14} className="c360-spin" aria-hidden />
              ) : (
                <Sparkles size={14} aria-hidden />
              )}
            </button>
          </div>
        </div>
      ) : null}

      <div className="c360-contacts-filters__search">
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by email…"
          aria-label="Search contacts"
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
        title="Email status"
        count={(facetValues.email_status?.length ?? 0) > 0 ? facetValues.email_status!.length : 0}
        defaultOpen
        onClear={
          (facetValues.email_status?.length ?? 0) > 0
            ? () => onFacetChange("email_status", [])
            : undefined
        }
      >
        <FilterCombobox
          label={emailStatusFacetSection.displayName}
          options={emailStatusFacetSection.options}
          selectedValues={facetValues.email_status ?? []}
          onSelectionChange={(next) => onFacetChange("email_status", next)}
          loading={emailStatusFacetSection.loading}
          loadingMore={emailStatusFacetSection.loadingMore}
          hasMore={
            filterSections.some((s) => s.filterKey === "email_status")
              ? emailStatusFacetSection.hasMore
              : false
          }
          onOpen={
            filterSections.some((s) => s.filterKey === "email_status")
              ? () => onSectionExpand("email_status")
              : () => {}
          }
          onLoadMore={
            filterSections.some((s) => s.filterKey === "email_status")
              ? () => onLoadMoreFacet("email_status")
              : () => {}
          }
          searchText={emailStatusFacetSection.searchText}
          onSearchChange={
            filterSections.some((s) => s.filterKey === "email_status")
              ? (text) => setFacetSearch("email_status", text)
              : () => {}
          }
        />
      </ContactsCollapsibleFilterSection>

      <ContactsCollapsibleFilterSection
        title="Sort"
        count={sortActiveCount}
        defaultOpen
        onClear={sortActiveCount > 0 ? () => onSortChange("newest") : undefined}
      >
        <ContactFilterSortSelect sortBy={sortBy} onSortChange={onSortChange} />
      </ContactsCollapsibleFilterSection>

      {onTableDensityChange ? (
        <ContactsCollapsibleFilterSection
          title="View"
          count={tableDensity === "compact" ? 1 : 0}
          defaultOpen={false}
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

      {facetSectionsWithoutEmailStatus.map((section) => {
        const vals = facetValues[section.filterKey] ?? [];
        const has = vals.length > 0;
        return (
          <ContactsCollapsibleFilterSection
            key={section.filterKey}
            title={section.displayName}
            count={has ? vals.length : 0}
            defaultOpen={has}
            onClear={
              has ? () => onFacetChange(section.filterKey, []) : undefined
            }
          >
            <FilterCombobox
              label={section.displayName}
              options={section.options}
              selectedValues={vals}
              onSelectionChange={(next) =>
                onFacetChange(section.filterKey, next)
              }
              loading={section.loading}
              loadingMore={section.loadingMore}
              hasMore={section.hasMore}
              onOpen={() => onSectionExpand(section.filterKey)}
              onLoadMore={() => onLoadMoreFacet(section.filterKey)}
              searchText={section.searchText}
              onSearchChange={(text) => setFacetSearch(section.filterKey, text)}
            />
          </ContactsCollapsibleFilterSection>
        );
      })}

      {companyFilterSections.length > 0 &&
      onCompanyFacetChange &&
      onCompanySectionExpand &&
      onLoadMoreCompanyFacet &&
      setCompanyFacetSearch
        ? companyFilterSections.map((section) => {
            const vals = companyFacetValues[section.filterKey] ?? [];
            const has = vals.length > 0;
            return (
              <ContactsCollapsibleFilterSection
                key={`company-facet-${section.filterKey}`}
                title={`Company · ${section.displayName}`}
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
                  onOpen={() => onCompanySectionExpand(section.filterKey)}
                  onLoadMore={() => onLoadMoreCompanyFacet(section.filterKey)}
                  searchText={section.searchText}
                  onSearchChange={(text) =>
                    setCompanyFacetSearch(section.filterKey, text)
                  }
                />
              </ContactsCollapsibleFilterSection>
            );
          })
        : null}

      <ContactsCollapsibleFilterSection
        title="Columns"
        count={hiddenColumnCount}
        defaultOpen={false}
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

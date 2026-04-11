"use client";

import { useCallback, useMemo } from "react";
import {
  ContactFilterEmailStatus,
  ContactFilterFacetField,
  ContactFilterSortSelect,
} from "@/components/feature/contacts/ContactFilterBar";
import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import type { FilterSection } from "@/hooks/useContactFilters";
import {
  CONTACTS_DT_COLUMN_IDS,
  CONTACTS_DT_COLUMN_LABELS,
  type ContactsDataTableColumnId,
} from "@/components/feature/contacts/ContactsDataTable";

export interface ContactsFilterSidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  filterSections: FilterSection[];
  facetValues: Record<string, string>;
  onFacetChange: (key: string, value: string) => void;
  onSectionExpand: (key: string) => void;
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
}

export function ContactsFilterSidebar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  filterSections,
  facetValues,
  onFacetChange,
  onSectionExpand,
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
}: ContactsFilterSidebarProps) {
  const facetActiveCount = useMemo(
    () =>
      Object.values(facetValues).filter(
        (v) => v != null && String(v).trim() !== "",
      ).length,
    [facetValues],
  );

  /** Tab + status + facets (excludes search / VQL) — used for chip-driven list scope. */
  const listScopeCount = useMemo(() => {
    let n = 0;
    if (activeTab === "net_new" || activeTab === "do_not_contact") n += 1;
    if (statusFilter !== "All") n += 1;
    n += facetActiveCount;
    return n;
  }, [activeTab, statusFilter, facetActiveCount]);

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
      onFacetChange(s.filterKey, "");
    }
  }, [filterSections, onFacetChange]);

  const clearAll = useCallback(() => {
    onSearchChange("");
    onActiveTabChange("total");
    onStatusChange("All");
    clearFacets();
    onClearVql();
  }, [
    clearFacets,
    onActiveTabChange,
    onClearVql,
    onSearchChange,
    onStatusChange,
  ]);

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
    } else if (activeTab === "do_not_contact") {
      out.push({
        key: "tab-dnc",
        label: "Do not contact",
        onRemove: () => onActiveTabChange("total"),
      });
    }
    if (statusFilter !== "All") {
      out.push({
        key: "status",
        label: `Status: ${statusFilter}`,
        onRemove: () => onStatusChange("All"),
      });
    }
    for (const [key, val] of Object.entries(facetValues)) {
      if (val != null && String(val).trim() !== "") {
        const section = filterSections.find((s) => s.filterKey === key);
        const label = section?.displayName ?? key;
        out.push({
          key: `facet-${key}`,
          label: `${label}: ${val}`,
          onRemove: () => onFacetChange(key, ""),
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
    statusFilter,
    facetValues,
    filterSections,
    advancedVqlRuleCount,
    sortChipLabel,
    hiddenColumnCount,
    visibleColumns.length,
    onSearchChange,
    onActiveTabChange,
    onStatusChange,
    onFacetChange,
    onClearVql,
    onSortChange,
    onResetVisibleColumns,
  ]);

  return (
    <div className="c360-contacts-filters">
      <div className="c360-contacts-filters__head">
        <h2 className="c360-contacts-filters__title">Filters</h2>
        {totalActiveCount > 0 ? (
          <span className="c360-contacts-filters__head-count" aria-hidden>
            {totalActiveCount}
          </span>
        ) : null}
      </div>

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

      {totalActiveCount > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="c360-contacts-filters__clear-all"
          onClick={clearAll}
        >
          Clear all filters
        </Button>
      ) : null}

      <ContactsCollapsibleFilterSection
        title="Email status"
        count={statusFilter !== "All" ? 1 : 0}
        defaultOpen
        onClear={
          statusFilter !== "All" ? () => onStatusChange("All") : undefined
        }
      >
        <ContactFilterEmailStatus
          statusFilter={statusFilter}
          onStatusChange={onStatusChange}
          showFilterIcon={false}
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

      {filterSections.map((section) => {
        const val = facetValues[section.filterKey] ?? "";
        const has = val.trim() !== "";
        return (
          <ContactsCollapsibleFilterSection
            key={section.filterKey}
            title={section.displayName}
            count={has ? 1 : 0}
            defaultOpen={has}
            onClear={
              has ? () => onFacetChange(section.filterKey, "") : undefined
            }
          >
            <ContactFilterFacetField
              section={section}
              value={val}
              onChange={(next) => onFacetChange(section.filterKey, next)}
              onSectionExpand={onSectionExpand}
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

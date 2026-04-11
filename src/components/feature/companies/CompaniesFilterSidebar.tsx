"use client";

import { useMemo, useCallback } from "react";
import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import type { CompanyFilterSection } from "@/hooks/useCompanyFilters";

export interface CompaniesFilterSidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterSections: CompanyFilterSection[];
  facetValues: Record<string, string>;
  onFacetChange: (key: string, value: string) => void;
  onSectionExpand: (key: string) => void;
  advancedVqlRuleCount: number;
  onClearVql: () => void;
  onOpenAdvanced: () => void;
}

export function CompaniesFilterSidebar({
  search,
  onSearchChange,
  filterSections,
  facetValues,
  onFacetChange,
  onSectionExpand,
  advancedVqlRuleCount,
  onClearVql,
  onOpenAdvanced,
}: CompaniesFilterSidebarProps) {
  const facetActiveCount = useMemo(
    () =>
      Object.values(facetValues).filter(
        (v) => v != null && String(v).trim() !== "",
      ).length,
    [facetValues],
  );

  const totalActiveCount = useMemo(() => {
    let n = facetActiveCount;
    if (search.trim()) n += 1;
    if (advancedVqlRuleCount > 0) n += 1;
    return n;
  }, [facetActiveCount, search, advancedVqlRuleCount]);

  const clearFacets = useCallback(() => {
    for (const s of filterSections) {
      onFacetChange(s.filterKey, "");
    }
  }, [filterSections, onFacetChange]);

  const clearAll = useCallback(() => {
    onSearchChange("");
    clearFacets();
    onClearVql();
  }, [clearFacets, onSearchChange, onClearVql]);

  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (search.trim()) {
      out.push({
        key: "search",
        label: `Search: ${search.trim()}`,
        onRemove: () => onSearchChange(""),
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
    return out;
  }, [
    search,
    facetValues,
    filterSections,
    advancedVqlRuleCount,
    onSearchChange,
    onFacetChange,
    onClearVql,
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
            <div className={cn("c360-filter-facet")}>
              <label className="c360-filter-facet__label">
                {section.displayName}
              </label>
              <Select
                value={val ?? ""}
                onChange={(e) =>
                  onFacetChange(section.filterKey, e.target.value)
                }
                onFocus={() => {
                  if (!section.options.length && !section.loading) {
                    onSectionExpand(section.filterKey);
                  }
                }}
                options={[
                  { value: "", label: section.loading ? "Loading…" : "Any" },
                  ...section.options.map((o) => ({
                    value: o.value,
                    label:
                      o.count != null
                        ? `${o.displayValue} (${o.count})`
                        : o.displayValue,
                  })),
                ]}
                fullWidth={false}
                className="c360-contact-filter-select c360-contact-filter-select--narrow"
              />
            </div>
          </ContactsCollapsibleFilterSection>
        );
      })}

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

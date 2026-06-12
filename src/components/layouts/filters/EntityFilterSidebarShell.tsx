"use client";

import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { FilterAccordionProvider } from "@/components/layouts/filters/FilterAccordionContext";
import { FilterChipList } from "@/components/layouts/filters/FilterChipList";
import type { FilterChipItem } from "@/components/layouts/filters/FilterChipList";
import { FilterGroupHeader } from "@/components/layouts/filters/FilterGroupHeader";
import { FilterSidebarBody } from "@/components/layouts/FilterSidebarBody";
import { FilterSidebarHeader } from "@/components/layouts/FilterSidebarHeader";
import { cn } from "@/lib/utils";

export type EntityFilterGroup = {
  id: string;
  label: string;
  filterKeys: string[];
};

export interface EntityFilterSidebarShellProps {
  className?: string;
  titleId?: string;
  activeCount: number;
  headerActions?: ReactNode;
  onClear?: () => void;
  onRefreshFilters?: () => void | Promise<void>;
  filtersRefreshing?: boolean;
  globalChips: FilterChipItem[];
  defaultOpenSectionId: string;
  searchSlot?: ReactNode;
  metaSections: ReactNode;
  groups: EntityFilterGroup[];
  filterSectionsByKey: Map<
    string,
    { filterKey: string; displayName: string; sectionId: string }
  >;
  renderFacetSection: (filterKey: string) => ReactNode;
  columnsSection: ReactNode;
  advancedSection: ReactNode;
  filtersStatus?: ReactNode;
}

export function EntityFilterSidebarShell({
  className,
  titleId,
  activeCount,
  headerActions,
  onClear,
  onRefreshFilters,
  filtersRefreshing = false,
  globalChips,
  defaultOpenSectionId,
  searchSlot,
  metaSections,
  groups,
  filterSectionsByKey,
  renderFacetSection,
  columnsSection,
  advancedSection,
  filtersStatus,
}: EntityFilterSidebarShellProps) {
  return (
    <div className={cn("c360-contacts-filters c360-entity-filters", className)}>
      <FilterSidebarHeader
        titleId={titleId}
        activeCount={activeCount}
        headerActions={headerActions}
        onClear={onClear}
        showHeadText={false}
        railActions={
          onRefreshFilters ? (
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
          ) : null
        }
      />

      <FilterSidebarBody>
        {searchSlot}
        <FilterChipList items={globalChips} ariaLabel="Active filters" />
        {filtersStatus}
        <FilterAccordionProvider defaultOpenSectionId={defaultOpenSectionId}>
          <div className="c360-entity-filters__sections">
            {metaSections}
            {groups.map((group) => {
              const keysInGroup = group.filterKeys.filter((k) =>
                filterSectionsByKey.has(k),
              );
              if (keysInGroup.length === 0) return null;
              return (
                <div key={group.id}>
                  <FilterGroupHeader>{group.label}</FilterGroupHeader>
                  {keysInGroup.map((filterKey) =>
                    renderFacetSection(filterKey),
                  )}
                </div>
              );
            })}
            {columnsSection}
          </div>
        </FilterAccordionProvider>
        {advancedSection}
      </FilterSidebarBody>
    </div>
  );
}

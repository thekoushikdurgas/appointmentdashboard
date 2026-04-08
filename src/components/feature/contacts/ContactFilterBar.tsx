"use client";

import { Filter } from "lucide-react";
import { Select } from "@/components/ui/Select";
import type { FilterSection } from "@/hooks/useContactFilters";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS_LIST = ["All", "Verified", "Found", "Unknown", "Risky"];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name A→Z" },
  { value: "name_desc", label: "Name Z→A" },
];

interface ContactFilterBarProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  /** Optional dynamic filter sections from useContactFilters. When provided,
   *  a secondary row of facet selects is shown below the status buttons. */
  filterSections?: FilterSection[];
  filterValues?: Record<string, string>;
  onFilterChange?: (filterKey: string, value: string) => void;
  onSectionExpand?: (filterKey: string) => void;
}

export function ContactFilterBar({
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  filterSections,
  filterValues,
  onFilterChange,
  onSectionExpand,
}: ContactFilterBarProps) {
  return (
    <div className="c360-filter-bar--stack">
      {/* Primary row: email-status quick filters + sort */}
      <div className="c360-filter-bar--plain">
        <Filter size={16} className="c360-text-muted c360-flex-shrink-0" />

        <div className="c360-status-btn-group">
          {STATUS_OPTIONS_LIST.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStatusChange(s)}
              className={cn(
                "c360-status-btn",
                statusFilter === s && "c360-status-btn--active",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          options={SORT_OPTIONS}
          fullWidth={false}
          className="c360-contact-filter-select"
        />
      </div>

      {/* Dynamic facet row */}
      {filterSections && filterSections.length > 0 && (
        <div className="c360-filter-bar--facets">
          {filterSections.map((section) => (
            <div key={section.filterKey} className="c360-filter-facet">
              <label className="c360-filter-facet__label">
                {section.displayName}
              </label>
              <Select
                value={filterValues?.[section.filterKey] ?? ""}
                onChange={(e) => {
                  onFilterChange?.(section.filterKey, e.target.value);
                }}
                onFocus={() => {
                  if (!section.options.length && !section.loading) {
                    onSectionExpand?.(section.filterKey);
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
          ))}
        </div>
      )}
    </div>
  );
}

export { STATUS_OPTIONS_LIST as STATUS_OPTIONS };

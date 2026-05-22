"use client";

import { useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  FilterCombobox,
  type FilterComboboxOption,
} from "@/components/ui/FilterCombobox";

const noop = () => {};

export interface HiringSignalDrawerContactFiltersProps {
  titleFilter: string;
  onTitleFilterChange: (value: string) => void;
  departmentOptions: FilterComboboxOption[];
  selectedDepartments: string[];
  onDepartmentsChange: (values: string[]) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function HiringSignalDrawerContactFilters({
  titleFilter,
  onTitleFilterChange,
  departmentOptions,
  selectedDepartments,
  onDepartmentsChange,
  onClear,
  disabled = false,
}: HiringSignalDrawerContactFiltersProps) {
  const [deptSearch, setDeptSearch] = useState("");

  const filteredDeptOptions = useMemo(() => {
    const q = deptSearch.trim().toLowerCase();
    if (!q) return departmentOptions;
    return departmentOptions.filter((o) =>
      o.displayValue.toLowerCase().includes(q),
    );
  }, [departmentOptions, deptSearch]);

  const hasActiveFilters =
    titleFilter.trim().length > 0 || selectedDepartments.length > 0;

  const handleClear = useCallback(() => {
    setDeptSearch("");
    onClear();
  }, [onClear]);

  return (
    <div className="c360-mb-3 c360-space-y-2">
      <div className="c360-hs-drawer-contact-filters__grid">
        <div>
          <label
            htmlFor="hs-drawer-contact-title"
            className="c360-mb-1 c360-block c360-text-2xs c360-font-medium c360-text-ink-muted"
          >
            Job title
          </label>
          <Input
            id="hs-drawer-contact-title"
            className="c360-w-full"
            value={titleFilter}
            onChange={(e) => onTitleFilterChange(e.target.value)}
            placeholder="e.g. Director, Engineer"
            disabled={disabled}
            inputSize="sm"
          />
        </div>
        <div>
          <FilterCombobox
            label="Department"
            options={filteredDeptOptions}
            selectedValues={selectedDepartments}
            onSelectionChange={onDepartmentsChange}
            loading={false}
            hasMore={false}
            onOpen={noop}
            onLoadMore={noop}
            searchText={deptSearch}
            onSearchChange={setDeptSearch}
            disabled={disabled || departmentOptions.length === 0}
          />
        </div>
      </div>
      {departmentOptions.length === 0 && !disabled ? (
        <p className="c360-m-0 c360-text-2xs c360-text-ink-muted">
          Department options come from indexed contacts at this company (first
          page loaded).
        </p>
      ) : null}
      {hasActiveFilters ? (
        <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2">
          {titleFilter.trim() ? (
            <span className="c360-inline-flex c360-items-center c360-gap-1 c360-rounded-full c360-border c360-border-ink-8 c360-bg-ink-1 c360-px-2 c360-py-0.5 c360-text-2xs">
              Title: {titleFilter.trim()}
              <button
                type="button"
                className="c360-inline-flex c360-text-ink-muted hover:c360-text-ink"
                aria-label="Clear job title filter"
                onClick={() => onTitleFilterChange("")}
              >
                <X size={12} />
              </button>
            </span>
          ) : null}
          {selectedDepartments.map((d) => (
            <span
              key={d}
              className="c360-inline-flex c360-items-center c360-gap-1 c360-rounded-full c360-border c360-border-ink-8 c360-bg-ink-1 c360-px-2 c360-py-0.5 c360-text-2xs"
            >
              {d}
              <button
                type="button"
                className="c360-inline-flex c360-text-ink-muted hover:c360-text-ink"
                aria-label={`Remove department ${d}`}
                onClick={() =>
                  onDepartmentsChange(
                    selectedDepartments.filter((x) => x !== d),
                  )
                }
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="c360-h-auto c360-min-h-0 c360-py-0 c360-text-2xs"
            onClick={handleClear}
          >
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  );
}

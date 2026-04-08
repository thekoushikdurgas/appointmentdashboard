"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface Filter {
  id: string;
  label: string;
  options: string[];
  type?: "select" | "checkbox" | "radio";
}

interface FilterSectionProps {
  filters: Filter[];
  onFilterChange?: (id: string, value: string | string[]) => void;
  title?: string;
}

export function FilterSection({
  filters,
  onFilterChange,
  title = "Filters",
}: FilterSectionProps) {
  const [expanded, setExpanded] = useState<string[]>(filters.map((f) => f.id));
  const [values, setValues] = useState<Record<string, string>>({});

  const toggleSection = (id: string) =>
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const handleChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    onFilterChange?.(id, value);
  };

  const clearAll = () => {
    setValues({});
    filters.forEach((f) => onFilterChange?.(f.id, ""));
  };

  const hasActive = Object.values(values).some((v) => v && v !== "All");

  return (
    <div>
      <div className="c360-filter-section__header">
        <span className="c360-filter-section__title">{title}</span>
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="c360-filter-section__clear-btn"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="c360-filter-section__stack">
        {filters.map((filter) => {
          const isOpen = expanded.includes(filter.id);
          return (
            <div key={filter.id}>
              <button
                type="button"
                onClick={() => toggleSection(filter.id)}
                className={cn(
                  "c360-filter-section__toggle",
                  isOpen && "c360-filter-section__toggle--open",
                )}
              >
                {filter.label}
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {isOpen && (
                <div className="c360-filter-section__options">
                  {filter.options.map((opt) => (
                    <label key={opt} className="c360-filter-section__option">
                      <input
                        type="radio"
                        name={filter.id}
                        value={opt}
                        checked={(values[filter.id] || "All") === opt}
                        onChange={() => handleChange(filter.id, opt)}
                        className="c360-radio__input"
                      />
                      <span className="c360-filter-section__option-label">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

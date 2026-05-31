"use client";

import type { ContactFilterChip } from "@/components/feature/contacts/contactFilterSectionChips";

export function FilterSectionChips({ chips }: { chips: ContactFilterChip[] }) {
  if (chips.length === 0) return null;

  return (
    <div
      className="c360-contacts-filter-section__chips"
      role="list"
      aria-label="Active filters in this section"
    >
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          role="listitem"
          className="c360-contacts-filters__chip"
          title="Remove filter"
          onClick={chip.onRemove}
        >
          <span>{chip.label}</span>
          <span aria-hidden>×</span>
        </button>
      ))}
    </div>
  );
}

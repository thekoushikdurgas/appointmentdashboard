"use client";

import type { FilterChipItem } from "@/components/layouts/filters/FilterChipList";
import { FilterChipList } from "@/components/layouts/filters/FilterChipList";
import type { ContactFilterChip } from "@/components/feature/contacts/contactFilterSectionChips";

export function FilterSectionChips({ chips }: { chips: ContactFilterChip[] }) {
  return (
    <FilterChipList
      items={chips as FilterChipItem[]}
      variant="section"
      ariaLabel="Active filters in this section"
    />
  );
}

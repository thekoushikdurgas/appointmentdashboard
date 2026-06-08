"use client";

import { resolveFilterSectionIcon } from "@/lib/filterSectionIcons";
import { cn } from "@/lib/utils";

export interface FilterSectionIconProps {
  title: string;
  filterKey?: string;
  sectionId?: string;
  size?: number;
  className?: string;
}

export function FilterSectionIcon({
  title,
  filterKey,
  sectionId,
  size = 14,
  className,
}: FilterSectionIconProps) {
  const Icon = resolveFilterSectionIcon({ title, filterKey, sectionId });
  return (
    <Icon
      size={size}
      className={cn("c360-contacts-filter-section__title-icon", className)}
      aria-hidden
    />
  );
}

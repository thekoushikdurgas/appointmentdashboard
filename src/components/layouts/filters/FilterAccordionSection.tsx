"use client";

import { CollapsibleFilterSection } from "@/components/layouts/filters/CollapsibleFilterSection";
import type { CollapsibleFilterSectionProps } from "@/components/layouts/filters/CollapsibleFilterSection";
import { useFilterAccordion } from "@/components/layouts/filters/FilterAccordionContext";

export type FilterAccordionSectionProps = CollapsibleFilterSectionProps & {
  sectionId: string;
};

export function FilterAccordionSection({
  sectionId,
  ...rest
}: FilterAccordionSectionProps) {
  const { openSectionId, requestOpenChange } = useFilterAccordion();

  return (
    <CollapsibleFilterSection
      {...rest}
      sectionId={sectionId}
      isOpen={openSectionId === sectionId}
      onOpenChange={(open) => requestOpenChange(sectionId, open)}
    />
  );
}

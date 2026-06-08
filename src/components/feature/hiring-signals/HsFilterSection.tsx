"use client";

import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import type { ContactsCollapsibleFilterSectionProps } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import { useHsFilterAccordion } from "@/components/feature/hiring-signals/HsFilterAccordionContext";
import type { HsFilterSectionId } from "@/components/feature/hiring-signals/hsFilterSectionIds";

export type HsFilterSectionProps = ContactsCollapsibleFilterSectionProps & {
  sectionId: HsFilterSectionId;
};

export function HsFilterSection({ sectionId, ...rest }: HsFilterSectionProps) {
  const { openSectionId, requestOpenChange } = useHsFilterAccordion();

  return (
    <ContactsCollapsibleFilterSection
      {...rest}
      sectionId={sectionId}
      isOpen={openSectionId === sectionId}
      onOpenChange={(open) => requestOpenChange(sectionId, open)}
    />
  );
}

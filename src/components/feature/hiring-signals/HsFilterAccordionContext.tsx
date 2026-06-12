"use client";

import {
  FilterAccordionProvider,
  nextFilterOpenSectionId,
  useFilterAccordion,
} from "@/components/layouts/filters/FilterAccordionContext";
import {
  HS_FILTER_SECTION_IDS,
  type HsFilterSectionId,
} from "@/components/feature/hiring-signals/hsFilterSectionIds";
import type { ReactNode } from "react";

export { nextFilterOpenSectionId as nextHsFilterOpenSectionId };

export function HsFilterAccordionProvider({
  children,
  defaultOpenSectionId = HS_FILTER_SECTION_IDS.companyName,
}: {
  children: ReactNode;
  defaultOpenSectionId?: HsFilterSectionId | null;
}) {
  return (
    <FilterAccordionProvider defaultOpenSectionId={defaultOpenSectionId}>
      {children}
    </FilterAccordionProvider>
  );
}

export function useHsFilterAccordion() {
  return useFilterAccordion();
}

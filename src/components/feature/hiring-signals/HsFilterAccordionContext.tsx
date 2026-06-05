"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  HS_FILTER_SECTION_IDS,
  nextHsFilterOpenSectionId,
  type HsFilterSectionId,
} from "@/components/feature/hiring-signals/hsFilterSectionIds";

type HsFilterAccordionContextValue = {
  openSectionId: string | null;
  requestOpenChange: (sectionId: string, open: boolean) => void;
};

const HsFilterAccordionContext =
  createContext<HsFilterAccordionContextValue | null>(null);

export function HsFilterAccordionProvider({
  children,
  defaultOpenSectionId = HS_FILTER_SECTION_IDS.companyName,
}: {
  children: ReactNode;
  defaultOpenSectionId?: HsFilterSectionId | null;
}) {
  const [openSectionId, setOpenSectionId] = useState<string | null>(
    defaultOpenSectionId,
  );

  const requestOpenChange = useCallback((sectionId: string, open: boolean) => {
    setOpenSectionId((prev) =>
      nextHsFilterOpenSectionId(prev, sectionId, open),
    );
  }, []);

  const value = useMemo(
    () => ({ openSectionId, requestOpenChange }),
    [openSectionId, requestOpenChange],
  );

  return (
    <HsFilterAccordionContext.Provider value={value}>
      {children}
    </HsFilterAccordionContext.Provider>
  );
}

export function useHsFilterAccordion(): HsFilterAccordionContextValue {
  const ctx = useContext(HsFilterAccordionContext);
  if (!ctx) {
    throw new Error(
      "useHsFilterAccordion must be used within HsFilterAccordionProvider",
    );
  }
  return ctx;
}

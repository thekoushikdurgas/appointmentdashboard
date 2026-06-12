"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Pure toggle helper for accordion open-state (unit-tested). */
export function nextFilterOpenSectionId(
  currentOpenId: string | null,
  sectionId: string,
  open: boolean,
): string | null {
  if (open) return sectionId;
  return currentOpenId === sectionId ? null : currentOpenId;
}

type FilterAccordionContextValue = {
  openSectionId: string | null;
  requestOpenChange: (sectionId: string, open: boolean) => void;
};

const FilterAccordionContext =
  createContext<FilterAccordionContextValue | null>(null);

export function FilterAccordionProvider({
  children,
  defaultOpenSectionId = null,
}: {
  children: ReactNode;
  defaultOpenSectionId?: string | null;
}) {
  const [openSectionId, setOpenSectionId] = useState<string | null>(
    defaultOpenSectionId,
  );

  const requestOpenChange = useCallback((sectionId: string, open: boolean) => {
    setOpenSectionId((prev) => nextFilterOpenSectionId(prev, sectionId, open));
  }, []);

  const value = useMemo(
    () => ({ openSectionId, requestOpenChange }),
    [openSectionId, requestOpenChange],
  );

  return (
    <FilterAccordionContext.Provider value={value}>
      {children}
    </FilterAccordionContext.Provider>
  );
}

export function useFilterAccordion(): FilterAccordionContextValue {
  const ctx = useContext(FilterAccordionContext);
  if (!ctx) {
    throw new Error(
      "useFilterAccordion must be used within FilterAccordionProvider",
    );
  }
  return ctx;
}

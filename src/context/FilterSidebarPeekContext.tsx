"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FilterSidebarAnimateState } from "@/components/layouts/filterSidebarMotion";

export type FilterSidebarPeekContextValue = {
  isHoverPeeking: boolean;
  effectiveAnimateState: FilterSidebarAnimateState;
  /** True when unpinned + collapsed — pin hover may temporarily expand. */
  peekEligible: boolean;
  setHoverPeeking: (value: boolean) => void;
};

const FilterSidebarPeekContext =
  createContext<FilterSidebarPeekContextValue | null>(null);

export function FilterSidebarPeekProvider({
  isHoverPeeking,
  effectiveAnimateState,
  peekEligible,
  setHoverPeeking,
  children,
}: FilterSidebarPeekContextValue & { children: ReactNode }) {
  return (
    <FilterSidebarPeekContext.Provider
      value={{
        isHoverPeeking,
        effectiveAnimateState,
        peekEligible,
        setHoverPeeking,
      }}
    >
      {children}
    </FilterSidebarPeekContext.Provider>
  );
}

export function useFilterSidebarPeek(): FilterSidebarPeekContextValue {
  const ctx = useContext(FilterSidebarPeekContext);
  if (!ctx) {
    throw new Error(
      "useFilterSidebarPeek must be used within FilterSidebarPeekProvider",
    );
  }
  return ctx;
}

/** Safe when peek provider is absent (e.g. pages without collapse). */
export function useOptionalFilterSidebarPeek(): FilterSidebarPeekContextValue | null {
  return useContext(FilterSidebarPeekContext);
}

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDataFiltersPanel } from "@/hooks/useDataFiltersPanel";

export type DataFiltersPanelContextValue = ReturnType<
  typeof useDataFiltersPanel
>;

const DataFiltersPanelContext =
  createContext<DataFiltersPanelContextValue | null>(null);

export function DataFiltersPanelProvider({
  storageKey,
  children,
}: {
  storageKey: string;
  children: ReactNode;
}) {
  const value = useDataFiltersPanel(storageKey);
  return (
    <DataFiltersPanelContext.Provider value={value}>
      {children}
    </DataFiltersPanelContext.Provider>
  );
}

export function useDataFiltersPanelContext(): DataFiltersPanelContextValue {
  const ctx = useContext(DataFiltersPanelContext);
  if (!ctx) {
    throw new Error(
      "useDataFiltersPanelContext must be used within DataFiltersPanelProvider",
    );
  }
  return ctx;
}

/** Safe when provider is absent (e.g. pages without filtersPanelStorageKey). */
export function useOptionalDataFiltersPanelContext(): DataFiltersPanelContextValue | null {
  return useContext(DataFiltersPanelContext);
}

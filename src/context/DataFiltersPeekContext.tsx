"use client";

import { createContext, useContext, type ReactNode } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

export type DataFiltersPeekScope =
  | "contacts"
  | "companies"
  | "hiring-signals"
  | "activities";

export interface DataFiltersPeekValue {
  pinned: boolean;
  togglePinned: () => void;
  /**
   * Portaled filter controls (Radix Select, combobox popovers) sit outside the peek
   * `<aside>`, so hover/focus-within no longer applies — call `true` when the overlay
   * opens and `false` when it closes (reference-counted in the layout provider).
   */
  notifyFilterOverlayOpen: (open: boolean) => void;
}

const DataFiltersPeekContext = createContext<DataFiltersPeekValue | null>(null);

export function useDataFiltersPeek(): DataFiltersPeekValue | null {
  return useContext(DataFiltersPeekContext);
}

export function DataFiltersPeekProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: DataFiltersPeekValue;
}) {
  return (
    <DataFiltersPeekContext.Provider value={value}>
      {children}
    </DataFiltersPeekContext.Provider>
  );
}

export function dataFiltersPeekPinnedStorageKey(
  scope: DataFiltersPeekScope,
): string {
  switch (scope) {
    case "contacts":
      return STORAGE_KEYS.DATA_FILTERS_PEEK_PINNED_CONTACTS;
    case "companies":
      return STORAGE_KEYS.DATA_FILTERS_PEEK_PINNED_COMPANIES;
    case "hiring-signals":
      return STORAGE_KEYS.DATA_FILTERS_PEEK_PINNED_HIRING_SIGNALS;
    case "activities":
      return STORAGE_KEYS.DATA_FILTERS_PEEK_PINNED_ACTIVITIES;
  }
}

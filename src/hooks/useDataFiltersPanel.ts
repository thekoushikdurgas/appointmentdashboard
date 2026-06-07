"use client";

import { useCallback, useEffect, useState } from "react";
import { useIsDesktop } from "@/hooks/common/useBreakpoint";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safeLocalStorage";

export type DataFiltersPanelState = {
  pinned: boolean;
  expanded: boolean;
};

export const DEFAULT_DATA_FILTERS_PANEL_STATE: DataFiltersPanelState = {
  pinned: true,
  expanded: true,
};

export function parseDataFiltersPanelState(
  raw: string | null,
): DataFiltersPanelState {
  if (!raw) return { ...DEFAULT_DATA_FILTERS_PANEL_STATE };
  try {
    const parsed = JSON.parse(raw) as Partial<DataFiltersPanelState>;
    return {
      pinned:
        typeof parsed.pinned === "boolean"
          ? parsed.pinned
          : DEFAULT_DATA_FILTERS_PANEL_STATE.pinned,
      expanded:
        typeof parsed.expanded === "boolean"
          ? parsed.expanded
          : DEFAULT_DATA_FILTERS_PANEL_STATE.expanded,
    };
  } catch {
    return { ...DEFAULT_DATA_FILTERS_PANEL_STATE };
  }
}

/** Pin on = expanded; pin off = collapsed rail (hover peek handled in layout). */
export function nextDataFiltersPanelStateAfterTogglePin(
  state: DataFiltersPanelState,
): DataFiltersPanelState {
  const pinned = !state.pinned;
  return {
    pinned,
    expanded: pinned,
  };
}

export function useDataFiltersPanel(storageKey: string) {
  const collapseEnabled = useIsDesktop();
  const [state, setState] = useState<DataFiltersPanelState>(
    DEFAULT_DATA_FILTERS_PANEL_STATE,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;
    setState(parseDataFiltersPanelState(tryLocalStorageGet(storageKey)));
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined" || !storageKey) return;
    tryLocalStorageSet(storageKey, JSON.stringify(state));
  }, [hydrated, state, storageKey]);

  const togglePin = useCallback(() => {
    setState((prev) => nextDataFiltersPanelStateAfterTogglePin(prev));
  }, []);

  /** Pin and expand the filter sidebar (toolbar Filters button). */
  const openFilters = useCallback(() => {
    setState({ pinned: true, expanded: true });
  }, []);

  const effectiveExpanded = collapseEnabled ? state.expanded : true;

  return {
    pinned: state.pinned,
    expanded: effectiveExpanded,
    collapseEnabled,
    togglePin,
    openFilters,
  };
}

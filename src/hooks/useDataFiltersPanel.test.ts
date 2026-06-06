/// <reference types="vitest/globals" />
import {
  DEFAULT_DATA_FILTERS_PANEL_STATE,
  nextDataFiltersPanelStateAfterTogglePin,
  parseDataFiltersPanelState,
} from "./useDataFiltersPanel";

describe("parseDataFiltersPanelState", () => {
  it("returns defaults when raw is null", () => {
    expect(parseDataFiltersPanelState(null)).toEqual(
      DEFAULT_DATA_FILTERS_PANEL_STATE,
    );
  });

  it("round-trips valid JSON", () => {
    const raw = JSON.stringify({ pinned: false, expanded: false });
    expect(parseDataFiltersPanelState(raw)).toEqual({
      pinned: false,
      expanded: false,
    });
  });

  it("falls back on invalid JSON", () => {
    expect(parseDataFiltersPanelState("{bad")).toEqual(
      DEFAULT_DATA_FILTERS_PANEL_STATE,
    );
  });

  it("fills missing fields with defaults", () => {
    expect(
      parseDataFiltersPanelState(JSON.stringify({ pinned: false })),
    ).toEqual({ pinned: false, expanded: true });
  });
});

describe("nextDataFiltersPanelStateAfterTogglePin", () => {
  it("unpinning collapses the rail", () => {
    expect(
      nextDataFiltersPanelStateAfterTogglePin({
        pinned: true,
        expanded: true,
      }),
    ).toEqual({ pinned: false, expanded: false });
  });

  it("pinning expands the panel", () => {
    expect(
      nextDataFiltersPanelStateAfterTogglePin({
        pinned: false,
        expanded: false,
      }),
    ).toEqual({ pinned: true, expanded: true });
  });
});

describe("localStorage round-trip", () => {
  const key = "c360-test-data-filters-panel";
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists pin and expand state", () => {
    const state = { pinned: false, expanded: false };
    localStorage.setItem(key, JSON.stringify(state));
    expect(parseDataFiltersPanelState(localStorage.getItem(key))).toEqual(
      state,
    );
  });
});

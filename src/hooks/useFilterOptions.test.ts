/// <reference types="vitest/globals" />
import {
  dedupeFilterOptionsByValue,
  canLoadMoreAfterPage,
  setCanLoadMoreFromResponse,
  FILTER_OPTIONS_PAGE_SIZE,
} from "./useFilterOptions";

describe("dedupeFilterOptionsByValue", () => {
  it("dedupes by value keeping first label", () => {
    const items = [
      { value: "a", displayValue: "A" },
      { value: "a", displayValue: "A2" },
      { value: "b", displayValue: "B" },
    ];
    const out = dedupeFilterOptionsByValue(items);
    expect(out).toHaveLength(2);
    expect(out[0].displayValue).toBe("A");
  });
});

describe("canLoadMoreAfterPage", () => {
  it("returns false on empty page", () => {
    expect(canLoadMoreAfterPage(10, 10, 0)).toBe(false);
  });

  it("returns false when merge did not grow (duplicate / overlap page)", () => {
    expect(canLoadMoreAfterPage(50, 50, 50)).toBe(false);
  });

  it("returns false on short final page", () => {
    expect(canLoadMoreAfterPage(40, 50, 10)).toBe(false);
  });

  it("returns true on first full page with new values", () => {
    expect(canLoadMoreAfterPage(0, 50, 50, FILTER_OPTIONS_PAGE_SIZE)).toBe(
      true,
    );
  });

  it("returns true when append page is full and merged grew", () => {
    expect(canLoadMoreAfterPage(50, 100, 50, FILTER_OPTIONS_PAGE_SIZE)).toBe(
      true,
    );
  });
});

describe("setCanLoadMoreFromResponse (legacy total-based)", () => {
  it("uses total when positive", () => {
    expect(setCanLoadMoreFromResponse(5, 10, 5)).toBe(true);
    expect(setCanLoadMoreFromResponse(10, 10, 5)).toBe(false);
  });

  it("infers from page size when total is 0", () => {
    expect(
      setCanLoadMoreFromResponse(50, 0, 50, FILTER_OPTIONS_PAGE_SIZE),
    ).toBe(true);
    expect(
      setCanLoadMoreFromResponse(10, 0, 10, FILTER_OPTIONS_PAGE_SIZE),
    ).toBe(false);
  });

  it("returns false when page is empty", () => {
    expect(setCanLoadMoreFromResponse(10, 100, 0)).toBe(false);
  });
});

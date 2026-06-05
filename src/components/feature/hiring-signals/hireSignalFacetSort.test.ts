/// <reference types="vitest/globals" />
import {
  mapHireSignalFacetRows,
  mergeAndSortHireSignalFacetOptions,
} from "@/components/feature/hiring-signals/hireSignalFacetOptions";
import { sortHireSignalFacetOptionsByCount } from "@/components/feature/hiring-signals/hireSignalFacetSort";

describe("sortHireSignalFacetOptionsByCount", () => {
  it("sorts by count desc then label asc", () => {
    const rows = [
      { value: "b", displayValue: "Beta", count: 5 },
      { value: "a", displayValue: "Alpha", count: 10 },
      { value: "c", displayValue: "Charlie", count: 10 },
    ];
    const sorted = sortHireSignalFacetOptionsByCount(rows);
    expect(sorted.map((r) => r.value)).toEqual(["a", "c", "b"]);
  });

  it("treats missing count as zero", () => {
    const rows = [
      { value: "a", displayValue: "A", count: 1 },
      { value: "b", displayValue: "B" },
    ];
    const sorted = sortHireSignalFacetOptionsByCount(rows);
    expect(sorted.map((r) => r.value)).toEqual(["a", "b"]);
  });
});

describe("mapHireSignalFacetRows", () => {
  it("keeps zero counts", () => {
    const mapped = mapHireSignalFacetRows([{ value: "x", count: 0 }]);
    expect(mapped[0]?.count).toBe(0);
  });
});

describe("mergeAndSortHireSignalFacetOptions", () => {
  it("dedupes and re-sorts merged pages", () => {
    const prev = mapHireSignalFacetRows([
      { value: "a", count: 3 },
      { value: "b", count: 1 },
    ]);
    const next = mapHireSignalFacetRows([
      { value: "b", count: 99 },
      { value: "c", count: 2 },
    ]);
    const merged = mergeAndSortHireSignalFacetOptions(prev, next);
    expect(merged.map((r) => r.value)).toEqual(["a", "c", "b"]);
    expect(merged.find((r) => r.value === "b")?.count).toBe(1);
  });
});

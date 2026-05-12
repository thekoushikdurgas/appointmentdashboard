/// <reference types="vitest/globals" />
import { aggregateHiringJobMarkers } from "./hiringJobLocationMarkers";

describe("aggregateHiringJobMarkers", () => {
  it("maps by location when present", () => {
    const agg = aggregateHiringJobMarkers([
      { location: "Berlin, Germany", country: "" },
    ]);
    expect(agg.skippedCount).toBe(0);
    expect(agg.mappedCount).toBe(1);
    expect(agg.markers.some((m) => m.label === "Germany")).toBe(true);
  });

  it("falls back to country when location is empty", () => {
    const agg = aggregateHiringJobMarkers([
      { location: "", country: "India" },
      { location: "   ", country: "Canada" },
    ]);
    expect(agg.skippedCount).toBe(0);
    expect(agg.mappedCount).toBe(2);
    expect(agg.rows.find((r) => r.label === "India")?.count).toBe(1);
    expect(agg.rows.find((r) => r.label === "Canada")?.count).toBe(1);
  });

  it("falls back to country when location is not parseable", () => {
    const agg = aggregateHiringJobMarkers([
      { location: "Unknownville, Xyzzyland", country: "France" },
    ]);
    expect(agg.skippedCount).toBe(0);
    expect(agg.mappedCount).toBe(1);
    expect(agg.markers.some((m) => m.label === "France")).toBe(true);
  });

  it("skips when neither location nor country resolves", () => {
    const agg = aggregateHiringJobMarkers([
      { location: "", country: "" },
      { location: "Remote", country: "" },
    ]);
    expect(agg.skippedCount).toBe(2);
    expect(agg.mappedCount).toBe(0);
    expect(agg.markers).toHaveLength(0);
  });
});

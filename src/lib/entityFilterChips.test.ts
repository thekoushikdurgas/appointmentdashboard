/// <reference types="vitest/globals" />
import { buildGlobalFilterChips } from "@/lib/entityFilterChips";

describe("buildGlobalFilterChips", () => {
  it("includes search, list scope, facet, and sort chips", () => {
    const chips = buildGlobalFilterChips({
      search: "acme@example.com",
      onClearSearch: () => {},
      facetValues: { title: ["CEO"] },
      excludedFacetValues: {},
      filterSections: [{ filterKey: "title", displayName: "Title" }],
      onFacetChange: () => {},
      activeTab: "net_new",
      onClearActiveTab: () => {},
      activeTabLabels: { net_new: "Net New" },
      sortChipLabel: "Newest first",
      onClearSort: () => {},
    });

    expect(chips.map((c) => c.key)).toEqual(
      expect.arrayContaining([
        "search",
        "list-scope",
        "facet-include-title",
        "sort-chip",
      ]),
    );
  });

  it("omits total list scope chip", () => {
    const chips = buildGlobalFilterChips({
      facetValues: {},
      filterSections: [],
      onFacetChange: () => {},
      activeTab: "total",
      onClearActiveTab: () => {},
    });
    expect(chips.find((c) => c.key === "list-scope")).toBeUndefined();
  });
});

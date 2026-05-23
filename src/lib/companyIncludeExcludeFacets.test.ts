import { describe, expect, it } from "vitest";
import {
  COMPANY_INCLUDE_EXCLUDE_FILTER_KEYS,
  companyFacetComboboxLabels,
  companyFacetVqlField,
  isCompanyIncludeExcludeFacet,
} from "@/lib/companyIncludeExcludeFacets";

describe("companyIncludeExcludeFacets", () => {
  it("lists all keyword include/exclude facet keys", () => {
    expect(COMPANY_INCLUDE_EXCLUDE_FILTER_KEYS).toContain("uuid");
    expect(COMPANY_INCLUDE_EXCLUDE_FILTER_KEYS).toContain("website");
    expect(COMPANY_INCLUDE_EXCLUDE_FILTER_KEYS).toContain("linkedin_url");
    expect(COMPANY_INCLUDE_EXCLUDE_FILTER_KEYS).toContain("normalized_domain");
  });

  it("recognizes include/exclude facets", () => {
    expect(isCompanyIncludeExcludeFacet("city")).toBe(true);
    expect(isCompanyIncludeExcludeFacet("uuid")).toBe(true);
    expect(isCompanyIncludeExcludeFacet("annual_revenue")).toBe(false);
  });

  it("maps uuid facet key to name for VQL", () => {
    expect(companyFacetVqlField("uuid")).toBe("name");
    expect(companyFacetVqlField("city")).toBe("city");
  });

  it("returns combobox labels per facet", () => {
    expect(companyFacetComboboxLabels("country", "Country")).toEqual({
      include: "Include countries",
      exclude: "Exclude countries",
    });
  });
});

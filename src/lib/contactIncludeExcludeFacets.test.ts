import { describe, expect, it } from "vitest";
import {
  CONTACT_INCLUDE_EXCLUDE_FILTER_KEYS,
  contactFacetComboboxLabels,
  isContactIncludeExcludeFacet,
} from "@/lib/contactIncludeExcludeFacets";

describe("contactIncludeExcludeFacets", () => {
  it("lists person and company include/exclude facet keys", () => {
    expect(CONTACT_INCLUDE_EXCLUDE_FILTER_KEYS).toContain("city");
    expect(CONTACT_INCLUDE_EXCLUDE_FILTER_KEYS).toContain("company_name");
    expect(CONTACT_INCLUDE_EXCLUDE_FILTER_KEYS).toContain("company_industries");
    expect(CONTACT_INCLUDE_EXCLUDE_FILTER_KEYS.length).toBeGreaterThan(7);
  });

  it("recognizes include/exclude facets", () => {
    expect(isContactIncludeExcludeFacet("departments")).toBe(true);
    expect(isContactIncludeExcludeFacet("company_city")).toBe(true);
    expect(isContactIncludeExcludeFacet("first_name")).toBe(false);
  });

  it("returns combobox labels", () => {
    expect(contactFacetComboboxLabels("email_status", "Email Status")).toEqual({
      include: "Include email status",
      exclude: "Exclude email status",
    });
    expect(
      contactFacetComboboxLabels("company_name", "Company · Name"),
    ).toEqual({
      include: "Include company names",
      exclude: "Exclude company names",
    });
  });
});

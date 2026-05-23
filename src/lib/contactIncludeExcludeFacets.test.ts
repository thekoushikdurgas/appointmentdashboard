import { describe, expect, it } from "vitest";
import {
  CONTACT_INCLUDE_EXCLUDE_FILTER_KEYS,
  contactFacetComboboxLabels,
  isContactIncludeExcludeFacet,
} from "@/lib/contactIncludeExcludeFacets";

describe("contactIncludeExcludeFacets", () => {
  it("lists seven include/exclude facet keys", () => {
    expect(CONTACT_INCLUDE_EXCLUDE_FILTER_KEYS).toEqual([
      "city",
      "country",
      "departments",
      "email_status",
      "seniority",
      "state",
      "title",
    ]);
  });

  it("recognizes include/exclude facets", () => {
    expect(isContactIncludeExcludeFacet("departments")).toBe(true);
    expect(isContactIncludeExcludeFacet("first_name")).toBe(false);
  });

  it("returns combobox labels", () => {
    expect(contactFacetComboboxLabels("email_status", "Email Status")).toEqual({
      include: "Include email status",
      exclude: "Exclude email status",
    });
  });
});

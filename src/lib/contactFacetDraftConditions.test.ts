/// <reference types="vitest/globals" />
import {
  contactFacetExcludeDraftCondition,
  contactFacetIncludeDraftCondition,
} from "@/lib/contactFacetDraftConditions";

describe("contactFacetDraftConditions", () => {
  it("builds include in_list for multiple departments", () => {
    const c = contactFacetIncludeDraftCondition("departments", [
      "Engineering",
      "Sales",
    ]);
    expect(c).toMatchObject({
      field: "departments",
      operator: "in_list",
      value: "Engineering,Sales",
    });
  });

  it("builds exclude not_in_list for multiple countries", () => {
    const c = contactFacetExcludeDraftCondition("country", ["us", "ca"]);
    expect(c).toMatchObject({
      field: "country",
      operator: "not_in_list",
      value: "us,ca",
    });
  });
});

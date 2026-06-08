import { describe, expect, it } from "vitest";
import { HS_FILTER_SECTION_IDS } from "@/components/feature/hiring-signals/hsFilterSectionIds";
import { resolveFilterSectionIcon } from "./filterSectionIcons";

describe("resolveFilterSectionIcon", () => {
  it("maps hiring signals section ids", () => {
    const Icon = resolveFilterSectionIcon({
      title: "ignored",
      sectionId: HS_FILTER_SECTION_IDS.jobLocation,
    });
    expect(Icon.displayName ?? Icon.name).toBeTruthy();
  });

  it("maps static sidebar titles", () => {
    const sort = resolveFilterSectionIcon({ title: "Sort" });
    const columns = resolveFilterSectionIcon({ title: "Columns" });
    expect(sort).not.toBe(columns);
  });

  it("maps API filter keys", () => {
    const email = resolveFilterSectionIcon({
      title: "Email Address",
      filterKey: "email",
    });
    const industry = resolveFilterSectionIcon({
      title: "Industry",
      filterKey: "industry",
    });
    expect(email).not.toBe(industry);
  });

  it("falls back from display title keywords", () => {
    const icon = resolveFilterSectionIcon({ title: "Annual Revenue Range" });
    expect(icon).toBeTruthy();
  });
});

/// <reference types="vitest/globals" />
import {
  HS_FILTER_SECTION_IDS,
  nextHsFilterOpenSectionId,
} from "./hsFilterSectionIds";

describe("nextHsFilterOpenSectionId", () => {
  it("opens the requested section when expanding", () => {
    expect(
      nextHsFilterOpenSectionId(
        HS_FILTER_SECTION_IDS.companyName,
        HS_FILTER_SECTION_IDS.datePosted,
        true,
      ),
    ).toBe(HS_FILTER_SECTION_IDS.datePosted);
  });

  it("collapses the current section when closing", () => {
    expect(
      nextHsFilterOpenSectionId(
        HS_FILTER_SECTION_IDS.datePosted,
        HS_FILTER_SECTION_IDS.datePosted,
        false,
      ),
    ).toBeNull();
  });

  it("leaves open id unchanged when closing a different section", () => {
    expect(
      nextHsFilterOpenSectionId(
        HS_FILTER_SECTION_IDS.jobTitle,
        HS_FILTER_SECTION_IDS.datePosted,
        false,
      ),
    ).toBe(HS_FILTER_SECTION_IDS.jobTitle);
  });

  it("defaults company name as first open section id constant", () => {
    expect(HS_FILTER_SECTION_IDS.companyName).toBe("company-name");
  });
});

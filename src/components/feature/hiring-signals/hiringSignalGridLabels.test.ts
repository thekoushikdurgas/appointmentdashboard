/// <reference types="vitest/globals" />
import type { LinkedInJobRow } from "@/lib/jobs/hiringSignalJobRows";
import {
  hiringSignalCompanyIndustriesSubtitle,
  hiringSignalTitleMetaLabel,
} from "./hiringSignalUiUtils";

function stubRow(overrides: Partial<LinkedInJobRow> = {}): LinkedInJobRow {
  return {
    id: "1",
    linkedinJobId: "1",
    runId: "",
    apifyItemId: "",
    title: "Engineer",
    companyName: "Acme",
    companyUuid: "",
    companyLogoUrl: "",
    location: "",
    country: "",
    postedAt: "",
    postedClockAt: "",
    employmentType: "",
    functionCategory: "",
    remoteAllowed: "",
    jobUrl: "",
    applyUrl: "",
    descriptionHtml: "",
    seniority: "",
    standardizedTitle: "",
    industries: "",
    ...overrides,
  };
}

describe("hiringSignalTitleMetaLabel", () => {
  it("combines seniority and function with ||", () => {
    expect(
      hiringSignalTitleMetaLabel(
        stubRow({
          seniority: "management",
          functionCategory: "customer service",
        }),
      ),
    ).toBe("Management || Customer Service");
  });

  it("dedupes when seniority and function format to the same label", () => {
    expect(
      hiringSignalTitleMetaLabel(
        stubRow({ seniority: "Management", functionCategory: "management" }),
      ),
    ).toBe("Management");
  });

  it("returns seniority only when function missing", () => {
    expect(hiringSignalTitleMetaLabel(stubRow({ seniority: "Director" }))).toBe(
      "Director",
    );
  });

  it("returns function only when seniority missing", () => {
    expect(
      hiringSignalTitleMetaLabel(stubRow({ functionCategory: "Engineering" })),
    ).toBe("Engineering");
  });

  it("returns empty when both missing", () => {
    expect(hiringSignalTitleMetaLabel(stubRow())).toBe("");
  });
});

describe("hiringSignalCompanyIndustriesSubtitle", () => {
  it("returns empty when no industries", () => {
    expect(hiringSignalCompanyIndustriesSubtitle(stubRow())).toEqual({
      text: "",
      title: "",
    });
  });

  it("shows up to two industries with +N more", () => {
    expect(
      hiringSignalCompanyIndustriesSubtitle(
        stubRow({
          companyIndustries: ["Retail", "Grocery", "Logistics"],
        }),
      ),
    ).toEqual({
      text: "Retail, Grocery +1",
      title: "Retail, Grocery, Logistics",
    });
  });

  it("formats industry labels", () => {
    expect(
      hiringSignalCompanyIndustriesSubtitle(
        stubRow({ companyIndustries: ["software development"] }),
      ),
    ).toEqual({
      text: "Software Development",
      title: "Software Development",
    });
  });
});

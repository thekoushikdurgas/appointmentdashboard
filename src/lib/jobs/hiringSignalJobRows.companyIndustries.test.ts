/// <reference types="vitest/globals" />
import { normalizeLinkedInJobRow } from "./hiringSignalJobRows";

describe("normalizeLinkedInJobRow companyIndustries", () => {
  it("maps companyIndustries array from API", () => {
    const row = normalizeLinkedInJobRow({
      linkedinJobId: "1",
      companyIndustries: ["Retail", "Grocery"],
    });
    expect(row.companyIndustries).toEqual(["Retail", "Grocery"]);
  });

  it("maps company_industries snake_case from API", () => {
    const row = normalizeLinkedInJobRow({
      linkedin_job_id: "2",
      company_industries: ["Software", "SaaS"],
    });
    expect(row.companyIndustries).toEqual(["Software", "SaaS"]);
  });

  it("falls back to raw_payload company industries when API field absent", () => {
    const row = normalizeLinkedInJobRow({
      linkedinJobId: "3",
      raw_payload: {
        company: { industries: "Retail, Grocery" },
      },
    });
    expect(row.companyIndustries).toEqual(["Retail", "Grocery"]);
  });

  it("prefers API companyIndustries over raw_payload fallback", () => {
    const row = normalizeLinkedInJobRow({
      linkedinJobId: "4",
      companyIndustries: ["Connectra Industry"],
      raw_payload: { industries: "Scrape Industry" },
    });
    expect(row.companyIndustries).toEqual(["Connectra Industry"]);
  });

  it("omits companyIndustries when no sources present", () => {
    const row = normalizeLinkedInJobRow({ linkedinJobId: "5", title: "Dev" });
    expect(row.companyIndustries).toBeUndefined();
  });
});

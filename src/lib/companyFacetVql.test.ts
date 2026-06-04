/// <reference types="vitest/globals" />
import { buildCompanyFacetVqlFilter } from "@/lib/companyFacetVql";

describe("buildCompanyFacetVqlFilter", () => {
  it("returns undefined when no facets active", () => {
    expect(buildCompanyFacetVqlFilter({}, {})).toBeUndefined();
  });

  it("maps uuid facet selections to name field in VQL", () => {
    const f = buildCompanyFacetVqlFilter({ uuid: ["Acme Corp"] }, {});
    expect(f?.conditions).toEqual([
      { field: "name", operator: "eq", value: "Acme Corp" },
    ]);
  });

  it("builds include eq and exclude ne for address", () => {
    const f = buildCompanyFacetVqlFilter(
      { address: ["123 Main St"] },
      { address: ["456 Oak Ave"] },
    );
    expect(f?.conditions).toEqual([
      { field: "address", operator: "eq", value: "123 Main St" },
      { field: "address", operator: "ne", value: "456 Oak Ave" },
    ]);
  });

  it("uses in and nin for multiple values", () => {
    const f = buildCompanyFacetVqlFilter(
      { country: ["US", "CA"] },
      { country: ["MX", "BR"] },
    );
    expect(f?.conditions).toEqual([
      { field: "country", operator: "in", value: ["US", "CA"] },
      { field: "country", operator: "nin", value: ["MX", "BR"] },
    ]);
  });

  it("lowercases industries for Connectra keyword index", () => {
    const f = buildCompanyFacetVqlFilter(
      { industries: ["Construction", "Real Estate"] },
      {},
    );
    expect(f?.conditions).toEqual([
      {
        field: "industries",
        operator: "in",
        value: ["construction", "real estate"],
      },
    ]);
  });

  it("builds employees_count range buckets (1–10 excludes zero)", () => {
    const f = buildCompanyFacetVqlFilter(
      { employees_count: ["1-10", "10-100"] },
      { employees_count: ["10000+"] },
    );
    expect(f?.allOf).toHaveLength(2);
    expect(f?.allOf?.[0]?.anyOf).toHaveLength(2);
    const includeBranches = f?.allOf?.[0]?.anyOf ?? [];
    expect(includeBranches[0]?.conditions).toEqual([
      { field: "employees_count", operator: "gte", value: 1 },
      { field: "employees_count", operator: "lte", value: 10 },
    ]);
    expect(f?.allOf?.[1]?.conditions).toEqual([
      { field: "employees_count", operator: "ngte", value: 10_000 },
    ]);
  });

  it("maps legacy employees_count bucket id 0-10 to 1-10", () => {
    const f = buildCompanyFacetVqlFilter({ employees_count: ["0-10"] }, {});
    expect(f?.conditions).toEqual([
      { field: "employees_count", operator: "gte", value: 1 },
      { field: "employees_count", operator: "lte", value: 10 },
    ]);
  });

  it("builds range bucket include as OR and exclude as AND", () => {
    const f = buildCompanyFacetVqlFilter(
      { annual_revenue: ["1-10000", "10000-50000"] },
      { annual_revenue: ["1000000000+"] },
    );
    expect(f?.allOf).toHaveLength(2);
    const includeBranches = f?.allOf?.[0]?.anyOf ?? [];
    expect(includeBranches).toHaveLength(2);
    expect(includeBranches[0]?.conditions).toEqual([
      { field: "annual_revenue", operator: "gte", value: 1 },
      { field: "annual_revenue", operator: "lte", value: 10_000 },
    ]);
    expect(f?.allOf?.[1]?.conditions).toEqual([
      { field: "annual_revenue", operator: "ngte", value: 1_000_000_000 },
    ]);
  });

  it("maps legacy total_funding bucket id 0-10000 to 1-10000", () => {
    const f = buildCompanyFacetVqlFilter({ total_funding: ["0-10000"] }, {});
    expect(f?.conditions).toEqual([
      { field: "total_funding", operator: "gte", value: 1 },
      { field: "total_funding", operator: "lte", value: 10_000 },
    ]);
  });
});

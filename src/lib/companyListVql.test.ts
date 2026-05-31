import { describe, expect, it } from "vitest";
import { buildCompanyListVql } from "@/lib/companyListVql";

describe("buildCompanyListVql sort", () => {
  it("maps employees sort to employeesCount orderBy", () => {
    const q = buildCompanyListVql(1, 25, "", {}, { sortBy: "employees_desc" });
    expect(q.orderBy).toEqual([
      { orderBy: "employeesCount", orderDirection: "desc" },
    ]);
  });

  it("maps location sort to country, state, city", () => {
    const q = buildCompanyListVql(1, 25, "", {}, { sortBy: "location_asc" });
    expect(q.orderBy).toEqual([
      { orderBy: "country", orderDirection: "asc" },
      { orderBy: "state", orderDirection: "asc" },
      { orderBy: "city", orderDirection: "asc" },
    ]);
  });

  it("maps domain sort to normalizedDomain", () => {
    const q = buildCompanyListVql(1, 25, "", {}, { sortBy: "domain_asc" });
    expect(q.orderBy).toEqual([
      { orderBy: "normalizedDomain", orderDirection: "asc" },
    ]);
  });

  it("maps contacts sort to contactCount orderBy for post-enrich sort", () => {
    const q = buildCompanyListVql(1, 25, "", {}, { sortBy: "contacts_desc" });
    expect(q.orderBy).toEqual([
      { orderBy: "contactCount", orderDirection: "desc" },
    ]);
  });
});

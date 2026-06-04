/// <reference types="vitest/globals" />
import { dedupeCompaniesById } from "@/lib/dedupeCompaniesById";
import type { Company } from "@/services/graphql/companiesService";

function co(id: string, name: string): Company {
  return {
    id,
    name,
    createdAt: "",
    updatedAt: "",
  };
}

describe("dedupeCompaniesById", () => {
  it("removes duplicate company ids keeping first row", () => {
    const items = [
      co("fb2f584d-54f4-52d7-8a91-278e0a81f7df", "A"),
      co("35e0aef3-c56e-53f5-80d8-ae79f5442e25", "B"),
      co("fb2f584d-54f4-52d7-8a91-278e0a81f7df", "A duplicate"),
    ];
    const out = dedupeCompaniesById(items);
    expect(out).toHaveLength(2);
    expect(out[0].name).toBe("A");
  });
});

import { companiesService } from "@/services/graphql/companiesService";
import {
  buildCompanyCohortListQuery,
  MAX_COMPANY_COHORT_UUIDS,
  COMPANY_COHORT_PAGE_SIZE,
} from "@/lib/companyCohortVql";

export type ResolveCompanyCohortResult = {
  uuids: string[];
  totalCompanies: number;
  truncated: boolean;
};

/**
 * Resolve Connectra company UUIDs for hiring-signals company cohort filters.
 */
export async function resolveCompanyCohortUuids(
  nameSearch: string,
  facetValues: Record<string, string[]>,
): Promise<ResolveCompanyCohortResult> {
  const uuids: string[] = [];
  const seen = new Set<string>();
  let totalCompanies = 0;
  let page = 1;

  while (uuids.length < MAX_COMPANY_COHORT_UUIDS) {
    const query = buildCompanyCohortListQuery(nameSearch, facetValues, page);
    const res = await companiesService.companyQuery(query);
    totalCompanies = res.total;
    for (const item of res.items) {
      const id = item.id?.trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      uuids.push(id);
      if (uuids.length >= MAX_COMPANY_COHORT_UUIDS) break;
    }
    if (res.items.length < COMPANY_COHORT_PAGE_SIZE) break;
    if (page * COMPANY_COHORT_PAGE_SIZE >= res.total) break;
    page += 1;
  }

  return {
    uuids,
    totalCompanies,
    truncated: totalCompanies > uuids.length,
  };
}

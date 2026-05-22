import { buildCompanyListVql } from "@/lib/companyListVql";
import {
  companyFacetFilterFromDraft,
  HIRE_SIGNAL_COMPANY_COHORT_PAGE_SIZE,
  HIRE_SIGNAL_COMPANY_COHORT_UUID_CAP,
  isCompanyCohortActive,
} from "@/lib/hireSignalCompanyCohort";
import { companiesService } from "@/services/graphql/companiesService";
import type { HiringSignalFilterDraft } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";

export type CompanyCohortResolveResult = {
  uuids: string[];
  total: number;
  truncated: boolean;
};

/**
 * Resolve Connectra company UUIDs for hiring-signals company cohort filters.
 * Returns `null` when no company cohort filters are active.
 */
export async function resolveCompanyCohortUuids(
  draft: HiringSignalFilterDraft,
): Promise<CompanyCohortResolveResult | null> {
  if (!isCompanyCohortActive(draft)) {
    return null;
  }

  const facetFilter = companyFacetFilterFromDraft(draft);
  const filters = facetFilter ? { filters: facetFilter } : {};
  const pageSize = HIRE_SIGNAL_COMPANY_COHORT_PAGE_SIZE;
  const uuids: string[] = [];
  let total = 0;
  let page = 1;

  while (uuids.length < HIRE_SIGNAL_COMPANY_COHORT_UUID_CAP) {
    const query = buildCompanyListVql(
      page,
      pageSize,
      draft.companyNameSearch,
      {
        ...filters,
        selectColumns: ["uuid"],
      },
      { sortBy: "newest" },
    );
    const res = await companiesService.companyQuery(query);
    total = res.total;
    for (const row of res.items) {
      const id = row.id?.trim();
      if (!id) continue;
      uuids.push(id);
      if (uuids.length >= HIRE_SIGNAL_COMPANY_COHORT_UUID_CAP) {
        break;
      }
    }
    if (res.items.length < pageSize) break;
    if (page * pageSize >= total) break;
    page += 1;
  }

  const truncated = total > uuids.length;
  return { uuids, total, truncated };
}

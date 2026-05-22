import { buildCompanyListVql } from "@/lib/companyListVql";
import {
  companyCohortExcludeFiltersFromDraft,
  companyCohortIncludeFiltersFromDraft,
  HIRE_SIGNAL_COMPANY_COHORT_PAGE_SIZE,
  HIRE_SIGNAL_COMPANY_COHORT_UUID_CAP,
  isCompanyCohortActive,
} from "@/lib/hireSignalCompanyCohort";
import { companiesService } from "@/services/graphql/companiesService";
import type { HiringSignalFilterDraft } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import type { VqlFilterInput } from "@/graphql/generated/types";

export type CompanyCohortResolveResult = {
  uuids: string[];
  excludedUuids: string[];
  total: number;
  truncated: boolean;
};

async function paginateCompanyUuidsFromFilter(
  cohortFilter: VqlFilterInput,
): Promise<{ uuids: string[]; total: number; truncated: boolean }> {
  const filters = { filters: cohortFilter };
  const pageSize = HIRE_SIGNAL_COMPANY_COHORT_PAGE_SIZE;
  const uuids: string[] = [];
  let total = 0;
  let page = 1;

  while (uuids.length < HIRE_SIGNAL_COMPANY_COHORT_UUID_CAP) {
    const query = buildCompanyListVql(
      page,
      pageSize,
      "",
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

  return { uuids, total, truncated: total > uuids.length };
}

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

  const includeFilter = companyCohortIncludeFiltersFromDraft(draft);
  const excludeFilter = companyCohortExcludeFiltersFromDraft(draft);

  let uuids: string[] = [];
  let total = 0;
  let truncated = false;

  if (includeFilter) {
    const inc = await paginateCompanyUuidsFromFilter(includeFilter);
    uuids = inc.uuids;
    total = inc.total;
    truncated = inc.truncated;
  }

  let excludedUuids: string[] = [];
  if (excludeFilter) {
    const ex = await paginateCompanyUuidsFromFilter(excludeFilter);
    excludedUuids = ex.uuids;
    if (uuids.length > 0 && excludedUuids.length > 0) {
      const exSet = new Set(excludedUuids);
      uuids = uuids.filter((id) => !exSet.has(id));
    }
  }

  return { uuids, excludedUuids, total, truncated };
}

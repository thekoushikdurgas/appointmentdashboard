import {
  isCompanyCohortActive,
  isCompanyCohortActiveExcludingNames,
} from "@/lib/hireSignalCompanyCohort";
import {
  fetchHireSignalResolveCompanyCohortUuids,
  parseResolveCompanyCohortPayload,
} from "@/services/graphql/hiringSignalService";
import type { HiringSignalFilterDraft } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";

export type CompanyCohortResolveResult = {
  uuids: string[];
  excludedUuids: string[];
  total: number;
  truncated: boolean;
};

const EMPTY_COHORT: CompanyCohortResolveResult = {
  uuids: [],
  excludedUuids: [],
  total: 0,
  truncated: false,
};

/**
 * Resolve company UUIDs for firmographic cohort filters via job.server (same buckets as facets).
 * Posting employer names are applied on the job index in `useHiringSignals`.
 */
export async function resolveCompanyCohortUuids(
  draft: HiringSignalFilterDraft,
): Promise<CompanyCohortResolveResult | null> {
  if (!isCompanyCohortActive(draft)) {
    return null;
  }

  if (!isCompanyCohortActiveExcludingNames(draft)) {
    return { ...EMPTY_COHORT };
  }

  try {
    const res = await fetchHireSignalResolveCompanyCohortUuids(draft);
    const parsed = parseResolveCompanyCohortPayload(
      res.hireSignal?.resolveCompanyCohortUuids,
    );
    return parsed;
  } catch {
    return { ...EMPTY_COHORT };
  }
}

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

  // #region agent log
  fetch("http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "7dc299",
    },
    body: JSON.stringify({
      sessionId: "7dc299",
      runId: "pre-fix",
      hypothesisId: "H1-H2",
      location: "resolveCompanyCohortUuids.ts:entry",
      message: "cohort resolve start (job.server)",
      data: {
        employeeSizes: draft.companyEmployeeSizes,
        funding: draft.companyFunding,
        revenue: draft.companyRevenue,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  try {
    const res = await fetchHireSignalResolveCompanyCohortUuids(draft);
    const parsed = parseResolveCompanyCohortPayload(
      res.hireSignal?.resolveCompanyCohortUuids,
    );

    // #region agent log
    fetch("http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "7dc299",
      },
      body: JSON.stringify({
        sessionId: "7dc299",
        runId: "pre-fix",
        hypothesisId: "H2-H3",
        location: "resolveCompanyCohortUuids.ts:success",
        message: "cohort resolve done",
        data: {
          uuidCount: parsed.uuids.length,
          excludedCount: parsed.excludedUuids.length,
          total: parsed.total,
          truncated: parsed.truncated,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return parsed;
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7300/ingest/efacfcad-0428-4256-933c-cee6eb66f540", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "7dc299",
      },
      body: JSON.stringify({
        sessionId: "7dc299",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "resolveCompanyCohortUuids.ts:error",
        message: "cohort resolve failed (non-fatal)",
        data: {
          error: err instanceof Error ? err.message : String(err),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return { ...EMPTY_COHORT };
  }
}

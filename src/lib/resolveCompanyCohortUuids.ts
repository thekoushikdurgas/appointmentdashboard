import type { HiringSignalFilterDraft } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import {
  buildCompanyCohortRequest,
  isCompanyCohortActive,
} from "@/lib/hireSignalCompanyCohortVql";
import {
  asRecord,
  fetchHireSignalCompanyCohortUuids,
} from "@/services/graphql/hiringSignalService";

export type CompanyCohortResolveResult = {
  uuids: string[];
  total: number;
  truncated: boolean;
};

export { isCompanyCohortActive };

export async function resolveCompanyCohortUuids(
  draft: HiringSignalFilterDraft,
): Promise<CompanyCohortResolveResult | null> {
  if (!isCompanyCohortActive(draft)) {
    return null;
  }
  const req = buildCompanyCohortRequest(draft);
  const raw = await fetchHireSignalCompanyCohortUuids(req);
  const env = asRecord(raw.hireSignal?.companyCohortUuids);
  const data = asRecord(env?.data) ?? env;
  const uuidsRaw = data?.uuids;
  const uuids = Array.isArray(uuidsRaw)
    ? uuidsRaw
        .map((x) => String(x).trim())
        .filter(Boolean)
    : [];
  const total =
    typeof data?.total === "number" && Number.isFinite(data.total)
      ? Math.max(0, Math.floor(data.total))
      : uuids.length;
  const truncated = Boolean(data?.truncated);
  return { uuids, total, truncated };
}

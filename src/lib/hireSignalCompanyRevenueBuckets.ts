import type {
  VqlConditionInput,
  VqlFilterInput,
} from "@/graphql/generated/types";

/** Fixed Connectra `annual_revenue` cohort buckets (value = bucket id). */
export const HIRE_SIGNAL_COMPANY_REVENUE_BUCKETS = [
  { id: "0-10000", label: "0 – 10,000", gte: 0, lte: 10_000 },
  { id: "10000-50000", label: "10,000 – 50,000", gte: 10_000, lte: 50_000 },
  { id: "50000-100000", label: "50,000 – 100,000", gte: 50_000, lte: 100_000 },
  {
    id: "100000-1000000",
    label: "100,000 – 1 Million",
    gte: 100_000,
    lte: 1_000_000,
  },
  {
    id: "1000000-10000000",
    label: "1 Million – 10 Million",
    gte: 1_000_000,
    lte: 10_000_000,
  },
  {
    id: "10000000-50000000",
    label: "10 Million – 50 Million",
    gte: 10_000_000,
    lte: 50_000_000,
  },
  {
    id: "50000000-1000000000",
    label: "50 Million – 1 Billion",
    gte: 50_000_000,
    lte: 1_000_000_000,
  },
  {
    id: "1000000000+",
    label: "1 Billion+",
    gte: 1_000_000_000,
    lte: null as number | null,
  },
] as const;

export type HireSignalCompanyRevenueBucketId =
  (typeof HIRE_SIGNAL_COMPANY_REVENUE_BUCKETS)[number]["id"];

export const HIRE_SIGNAL_COMPANY_REVENUE_FIELD = "annual_revenue" as const;

const BUCKET_BY_ID = new Map(
  HIRE_SIGNAL_COMPANY_REVENUE_BUCKETS.map((b) => [b.id, b]),
);

export function formatCompanyRevenueBucketLabel(id: string): string {
  return BUCKET_BY_ID.get(id as HireSignalCompanyRevenueBucketId)?.label ?? id;
}

export function isKnownRevenueBucketId(
  id: string,
): id is HireSignalCompanyRevenueBucketId {
  return BUCKET_BY_ID.has(id as HireSignalCompanyRevenueBucketId);
}

/** One bucket → VQL range on `annual_revenue`. */
export function revenueBucketVqlFilter(
  bucketId: string,
): VqlFilterInput | undefined {
  const b = BUCKET_BY_ID.get(bucketId as HireSignalCompanyRevenueBucketId);
  if (!b) return undefined;
  const conditions: VqlConditionInput[] = [
    {
      field: HIRE_SIGNAL_COMPANY_REVENUE_FIELD,
      operator: "gte",
      value: b.gte as unknown as VqlConditionInput["value"],
    },
  ];
  if (b.lte != null) {
    conditions.push({
      field: HIRE_SIGNAL_COMPANY_REVENUE_FIELD,
      operator: "lte",
      value: b.lte as unknown as VqlConditionInput["value"],
    });
  }
  return { conditions };
}

/** Selected bucket ids → OR of range filters (include/exclude cohort). */
export function companyRevenueTokensToVqlFilter(
  tokens: string[],
): VqlFilterInput | undefined {
  const ids = tokens.map((t) => t.trim()).filter(isKnownRevenueBucketId);
  if (ids.length === 0) return undefined;
  if (ids.length === 1) return revenueBucketVqlFilter(ids[0]);
  const branches = ids
    .map((id) => revenueBucketVqlFilter(id))
    .filter((f): f is VqlFilterInput => f != null);
  if (branches.length === 0) return undefined;
  if (branches.length === 1) return branches[0];
  return { anyOf: branches };
}

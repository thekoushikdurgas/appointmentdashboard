import type {
  VqlConditionInput,
  VqlFilterInput,
} from "@/graphql/generated/types";

import { LEGACY_MONEY_RANGE_BUCKET_IDS } from "@/lib/companyRangeBuckets";

/** Fixed Connectra `total_funding` cohort buckets (value = bucket id). */
export const HIRE_SIGNAL_COMPANY_FUNDING_BUCKETS = [
  { id: "1-10000", label: "1 – 10,000", gte: 1, lte: 10_000 },
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

export type HireSignalCompanyFundingBucketId =
  (typeof HIRE_SIGNAL_COMPANY_FUNDING_BUCKETS)[number]["id"];

export const HIRE_SIGNAL_COMPANY_FUNDING_FIELD = "total_funding" as const;

const BUCKET_BY_ID = new Map(
  HIRE_SIGNAL_COMPANY_FUNDING_BUCKETS.map((b) => [b.id, b]),
);

export function formatCompanyFundingBucketLabel(id: string): string {
  return BUCKET_BY_ID.get(id as HireSignalCompanyFundingBucketId)?.label ?? id;
}

export function normalizeFundingBucketId(id: string): string {
  const trimmed = id.trim();
  return LEGACY_MONEY_RANGE_BUCKET_IDS[trimmed] ?? trimmed;
}

export function isKnownFundingBucketId(
  id: string,
): id is HireSignalCompanyFundingBucketId {
  return BUCKET_BY_ID.has(
    normalizeFundingBucketId(id) as HireSignalCompanyFundingBucketId,
  );
}

/** One bucket → VQL range on `total_funding`. */
export function fundingBucketVqlFilter(
  bucketId: string,
): VqlFilterInput | undefined {
  const normalized = normalizeFundingBucketId(bucketId);
  const b = BUCKET_BY_ID.get(normalized as HireSignalCompanyFundingBucketId);
  if (!b) return undefined;
  const conditions: VqlConditionInput[] = [
    {
      field: HIRE_SIGNAL_COMPANY_FUNDING_FIELD,
      operator: "gte",
      value: b.gte as unknown as VqlConditionInput["value"],
    },
  ];
  if (b.lte != null) {
    conditions.push({
      field: HIRE_SIGNAL_COMPANY_FUNDING_FIELD,
      operator: "lte",
      value: b.lte as unknown as VqlConditionInput["value"],
    });
  }
  return { conditions };
}

/** Selected bucket ids → OR of range filters (include/exclude cohort). */
export function companyFundingTokensToVqlFilter(
  tokens: string[],
): VqlFilterInput | undefined {
  const ids = tokens
    .map((t) => normalizeFundingBucketId(t))
    .filter(isKnownFundingBucketId);
  if (ids.length === 0) return undefined;
  if (ids.length === 1) return fundingBucketVqlFilter(ids[0]);
  const branches = ids
    .map((id) => fundingBucketVqlFilter(id))
    .filter((f): f is VqlFilterInput => f != null);
  if (branches.length === 0) return undefined;
  if (branches.length === 1) return branches[0];
  return { anyOf: branches };
}

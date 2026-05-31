import type {
  VqlConditionInput,
  VqlFilterInput,
} from "@/graphql/generated/types";

const LEGACY_EMPLOYEE_SIZE_BUCKET_IDS: Record<string, string> = {
  "0-10": "1-10",
};

/** Fixed Connectra `employees_count` cohort buckets (value = bucket id). */
export const HIRE_SIGNAL_COMPANY_EMPLOYEE_SIZE_BUCKETS = [
  { id: "1-10", label: "1 – 10", gte: 1, lte: 10 },
  { id: "10-100", label: "10 – 100", gte: 10, lte: 100 },
  { id: "100-500", label: "100-500", gte: 100, lte: 500 },
  { id: "500-1000", label: "500-1000", gte: 500, lte: 1000 },
  { id: "1000-5000", label: "1000-5000", gte: 1000, lte: 5000 },
  { id: "5000-10000", label: "5000-10000", gte: 5000, lte: 10000 },
  { id: "10000+", label: "10000+", gte: 10000, lte: null as number | null },
] as const;

export type HireSignalCompanyEmployeeSizeBucketId =
  (typeof HIRE_SIGNAL_COMPANY_EMPLOYEE_SIZE_BUCKETS)[number]["id"];

export const HIRE_SIGNAL_COMPANY_EMPLOYEE_SIZE_FIELD =
  "employees_count" as const;

const BUCKET_BY_ID = new Map(
  HIRE_SIGNAL_COMPANY_EMPLOYEE_SIZE_BUCKETS.map((b) => [b.id, b]),
);

export function formatCompanyEmployeeSizeBucketLabel(id: string): string {
  const normalized = normalizeEmployeeSizeBucketId(id);
  return (
    BUCKET_BY_ID.get(normalized as HireSignalCompanyEmployeeSizeBucketId)
      ?.label ?? id
  );
}

function normalizeEmployeeSizeBucketId(id: string): string {
  const trimmed = id.trim();
  return LEGACY_EMPLOYEE_SIZE_BUCKET_IDS[trimmed] ?? trimmed;
}

export function isKnownEmployeeSizeBucketId(
  id: string,
): id is HireSignalCompanyEmployeeSizeBucketId {
  return BUCKET_BY_ID.has(
    normalizeEmployeeSizeBucketId(id) as HireSignalCompanyEmployeeSizeBucketId,
  );
}

/** One bucket → VQL range on `employees_count`. */
export function employeeSizeBucketVqlFilter(
  bucketId: string,
): VqlFilterInput | undefined {
  const b = BUCKET_BY_ID.get(
    normalizeEmployeeSizeBucketId(
      bucketId,
    ) as HireSignalCompanyEmployeeSizeBucketId,
  );
  if (!b) return undefined;
  const conditions: VqlConditionInput[] = [
    {
      field: HIRE_SIGNAL_COMPANY_EMPLOYEE_SIZE_FIELD,
      operator: "gte",
      value: b.gte as unknown as VqlConditionInput["value"],
    },
  ];
  if (b.lte != null) {
    conditions.push({
      field: HIRE_SIGNAL_COMPANY_EMPLOYEE_SIZE_FIELD,
      operator: "lte",
      value: b.lte as unknown as VqlConditionInput["value"],
    });
  }
  return { conditions };
}

/** Selected bucket ids → OR of range filters (include/exclude cohort). */
export function companyEmployeeSizeTokensToVqlFilter(
  tokens: string[],
): VqlFilterInput | undefined {
  const ids = tokens
    .map((t) => normalizeEmployeeSizeBucketId(t))
    .filter(isKnownEmployeeSizeBucketId);
  if (ids.length === 0) return undefined;
  if (ids.length === 1) return employeeSizeBucketVqlFilter(ids[0]);
  const branches = ids
    .map((id) => employeeSizeBucketVqlFilter(id))
    .filter((f): f is VqlFilterInput => f != null);
  if (branches.length === 0) return undefined;
  if (branches.length === 1) return branches[0];
  return { anyOf: branches };
}

import type {
  VqlConditionInput,
  VqlFilterInput,
} from "@/graphql/generated/types";

export type CompanyRangeBucketDef = {
  id: string;
  label: string;
  gte: number;
  lte: number | null;
};

/** Fixed numeric range buckets for `annual_revenue` and `total_funding`. */
export const COMPANY_MONEY_RANGE_BUCKETS: readonly CompanyRangeBucketDef[] = [
  { id: "1-10000", label: "1 – 10,000", gte: 1, lte: 10_000 },
  { id: "10000-50000", label: "10,000 – 50,000", gte: 10_000, lte: 50_000 },
  { id: "50000-100000", label: "50,000 – 1 Lakh", gte: 50_000, lte: 100_000 },
  {
    id: "100000-1000000",
    label: "1 Lakh – 1 Million",
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
    lte: null,
  },
];

/** Saved searches may still store legacy bucket ids before the 1-based lower bound. */
export const LEGACY_EMPLOYEES_COUNT_BUCKET_IDS: Record<string, string> = {
  "0-10": "1-10",
};

export const LEGACY_MONEY_RANGE_BUCKET_IDS: Record<string, string> = {
  "0-10000": "1-10000",
};

/** Fixed range buckets for `employees_count`. */
export const COMPANY_EMPLOYEES_COUNT_BUCKETS: readonly CompanyRangeBucketDef[] =
  [
    { id: "1-10", label: "1 – 10", gte: 1, lte: 10 },
    { id: "10-100", label: "10 – 100", gte: 10, lte: 100 },
    { id: "100-500", label: "100 – 500", gte: 100, lte: 500 },
    { id: "500-1000", label: "500 – 1,000", gte: 500, lte: 1000 },
    { id: "1000-5000", label: "1,000 – 5,000", gte: 1000, lte: 5000 },
    { id: "5000-10000", label: "5,000 – 10,000", gte: 5000, lte: 10_000 },
    { id: "10000+", label: "10,000+", gte: 10_000, lte: null },
  ];

/** @deprecated Use COMPANY_MONEY_RANGE_BUCKETS */
export const COMPANY_RANGE_BUCKETS = COMPANY_MONEY_RANGE_BUCKETS;

export const COMPANY_ANNUAL_REVENUE_FIELD = "annual_revenue" as const;
export const COMPANY_TOTAL_FUNDING_FIELD = "total_funding" as const;
export const COMPANY_EMPLOYEES_COUNT_FIELD = "employees_count" as const;
export const CONTACT_COMPANY_ANNUAL_REVENUE_FIELD =
  "company_annual_revenue" as const;
export const CONTACT_COMPANY_TOTAL_FUNDING_FIELD =
  "company_total_funding" as const;
export const CONTACT_COMPANY_EMPLOYEES_COUNT_FIELD =
  "company_employees_count" as const;

const BUCKETS_BY_FIELD: Record<string, readonly CompanyRangeBucketDef[]> = {
  [COMPANY_ANNUAL_REVENUE_FIELD]: COMPANY_MONEY_RANGE_BUCKETS,
  [COMPANY_TOTAL_FUNDING_FIELD]: COMPANY_MONEY_RANGE_BUCKETS,
  [COMPANY_EMPLOYEES_COUNT_FIELD]: COMPANY_EMPLOYEES_COUNT_BUCKETS,
  [CONTACT_COMPANY_ANNUAL_REVENUE_FIELD]: COMPANY_MONEY_RANGE_BUCKETS,
  [CONTACT_COMPANY_TOTAL_FUNDING_FIELD]: COMPANY_MONEY_RANGE_BUCKETS,
  [CONTACT_COMPANY_EMPLOYEES_COUNT_FIELD]: COMPANY_EMPLOYEES_COUNT_BUCKETS,
};

export const COMPANY_RANGE_BUCKET_FILTER_KEYS = [
  COMPANY_ANNUAL_REVENUE_FIELD,
  COMPANY_TOTAL_FUNDING_FIELD,
  COMPANY_EMPLOYEES_COUNT_FIELD,
  CONTACT_COMPANY_ANNUAL_REVENUE_FIELD,
  CONTACT_COMPANY_TOTAL_FUNDING_FIELD,
  CONTACT_COMPANY_EMPLOYEES_COUNT_FIELD,
] as const;

export type CompanyRangeBucketFilterKey =
  (typeof COMPANY_RANGE_BUCKET_FILTER_KEYS)[number];

const RANGE_BUCKET_SET = new Set<string>(COMPANY_RANGE_BUCKET_FILTER_KEYS);

function bucketMapForField(
  field: string,
): Map<string, CompanyRangeBucketDef> | null {
  const defs = BUCKETS_BY_FIELD[field];
  if (!defs) return null;
  return new Map(defs.map((b) => [b.id, b]));
}

export function isCompanyRangeBucketFacet(
  filterKey: string,
): filterKey is CompanyRangeBucketFilterKey {
  return RANGE_BUCKET_SET.has(filterKey);
}

export function normalizeCompanyRangeBucketId(
  field: string,
  id: string,
): string {
  const trimmed = id.trim();
  if (
    field === COMPANY_EMPLOYEES_COUNT_FIELD ||
    field === CONTACT_COMPANY_EMPLOYEES_COUNT_FIELD
  ) {
    return LEGACY_EMPLOYEES_COUNT_BUCKET_IDS[trimmed] ?? trimmed;
  }
  if (
    field === COMPANY_ANNUAL_REVENUE_FIELD ||
    field === COMPANY_TOTAL_FUNDING_FIELD ||
    field === CONTACT_COMPANY_ANNUAL_REVENUE_FIELD ||
    field === CONTACT_COMPANY_TOTAL_FUNDING_FIELD
  ) {
    return LEGACY_MONEY_RANGE_BUCKET_IDS[trimmed] ?? trimmed;
  }
  return trimmed;
}

export function isKnownCompanyRangeBucketId(
  field: string,
  id: string,
): boolean {
  const m = bucketMapForField(field);
  return m != null && m.has(normalizeCompanyRangeBucketId(field, id));
}

export function formatCompanyRangeBucketLabel(
  field: string,
  id: string,
): string {
  const normalized = normalizeCompanyRangeBucketId(field, id);
  return bucketMapForField(field)?.get(normalized)?.label ?? id;
}

export function formatCompanyRevenueBucketLabel(id: string): string {
  return formatCompanyRangeBucketLabel(COMPANY_ANNUAL_REVENUE_FIELD, id);
}

export function formatCompanyFundingBucketLabel(id: string): string {
  return formatCompanyRangeBucketLabel(COMPANY_TOTAL_FUNDING_FIELD, id);
}

export function formatCompanyEmployeesCountBucketLabel(id: string): string {
  return formatCompanyRangeBucketLabel(COMPANY_EMPLOYEES_COUNT_FIELD, id);
}

function rangeBucketIncludeVql(
  field: string,
  bucketId: string,
): VqlFilterInput | undefined {
  const b = bucketMapForField(field)?.get(
    normalizeCompanyRangeBucketId(field, bucketId),
  );
  if (!b) return undefined;
  const conditions: VqlConditionInput[] = [
    {
      field,
      operator: "gte",
      value: b.gte as unknown as VqlConditionInput["value"],
    },
  ];
  if (b.lte != null) {
    conditions.push({
      field,
      operator: "lte",
      value: b.lte as unknown as VqlConditionInput["value"],
    });
  }
  return { conditions };
}

/** Exclude companies whose value falls inside the bucket (must_not range). */
function rangeBucketExcludeVql(
  field: string,
  bucketId: string,
): VqlFilterInput | undefined {
  const b = bucketMapForField(field)?.get(
    normalizeCompanyRangeBucketId(field, bucketId),
  );
  if (!b) return undefined;
  const conditions: VqlConditionInput[] = [
    {
      field,
      operator: "ngte",
      value: b.gte as unknown as VqlConditionInput["value"],
    },
  ];
  if (b.lte != null) {
    conditions.push({
      field,
      operator: "nlte",
      value: b.lte as unknown as VqlConditionInput["value"],
    });
  }
  return { conditions };
}

export function companyRangeBucketTokensToIncludeVql(
  field: string,
  tokens: string[],
): VqlFilterInput | undefined {
  const ids = tokens
    .map((t) => normalizeCompanyRangeBucketId(field, t))
    .filter((id) => isKnownCompanyRangeBucketId(field, id));
  if (ids.length === 0) return undefined;
  if (ids.length === 1) return rangeBucketIncludeVql(field, ids[0]);
  const branches = ids
    .map((id) => rangeBucketIncludeVql(field, id))
    .filter((f): f is VqlFilterInput => f != null);
  if (branches.length === 0) return undefined;
  if (branches.length === 1) return branches[0];
  return { anyOf: branches };
}

export function companyRangeBucketTokensToExcludeVql(
  field: string,
  tokens: string[],
): VqlFilterInput | undefined {
  const ids = tokens
    .map((t) => normalizeCompanyRangeBucketId(field, t))
    .filter((id) => isKnownCompanyRangeBucketId(field, id));
  if (ids.length === 0) return undefined;
  if (ids.length === 1) return rangeBucketExcludeVql(field, ids[0]);
  const branches = ids
    .map((id) => rangeBucketExcludeVql(field, id))
    .filter((f): f is VqlFilterInput => f != null);
  if (branches.length === 0) return undefined;
  if (branches.length === 1) return branches[0];
  return { allOf: branches };
}

export function companyRevenueTokensToVqlFilter(
  tokens: string[],
): VqlFilterInput | undefined {
  return companyRangeBucketTokensToIncludeVql(
    COMPANY_ANNUAL_REVENUE_FIELD,
    tokens,
  );
}

export function companyFundingTokensToVqlFilter(
  tokens: string[],
): VqlFilterInput | undefined {
  return companyRangeBucketTokensToIncludeVql(
    COMPANY_TOTAL_FUNDING_FIELD,
    tokens,
  );
}

export function companyEmployeesCountTokensToVqlFilter(
  tokens: string[],
): VqlFilterInput | undefined {
  return companyRangeBucketTokensToIncludeVql(
    COMPANY_EMPLOYEES_COUNT_FIELD,
    tokens,
  );
}

export function companyRangeBucketComboboxLabels(
  filterKey: CompanyRangeBucketFilterKey,
): { include: string; exclude: string } {
  switch (filterKey) {
    case COMPANY_ANNUAL_REVENUE_FIELD:
      return {
        include: "Include annual revenue",
        exclude: "Exclude annual revenue",
      };
    case COMPANY_TOTAL_FUNDING_FIELD:
      return {
        include: "Include total funding",
        exclude: "Exclude total funding",
      };
    case COMPANY_EMPLOYEES_COUNT_FIELD:
    case CONTACT_COMPANY_EMPLOYEES_COUNT_FIELD:
      return {
        include: "Include employees count",
        exclude: "Exclude employees count",
      };
    case CONTACT_COMPANY_ANNUAL_REVENUE_FIELD:
      return {
        include: "Include company annual revenue",
        exclude: "Exclude company annual revenue",
      };
    case CONTACT_COMPANY_TOTAL_FUNDING_FIELD:
      return {
        include: "Include company total funding",
        exclude: "Exclude company total funding",
      };
    default:
      return { include: "Include", exclude: "Exclude" };
  }
}

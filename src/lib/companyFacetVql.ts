import type {
  VqlConditionInput,
  VqlFilterInput,
} from "@/graphql/generated/types";
import { companyFacetVqlField } from "@/lib/companyIncludeExcludeFacets";
import {
  companyRangeBucketTokensToExcludeVql,
  companyRangeBucketTokensToIncludeVql,
  isCompanyRangeBucketFacet,
} from "@/lib/companyRangeBuckets";

function trimValues(vals: string[] | undefined): string[] {
  if (!vals?.length) return [];
  return vals.map((v) => String(v).trim()).filter(Boolean);
}

function facetCondition(
  field: string,
  vals: string[],
  mode: "include" | "exclude",
): VqlConditionInput | null {
  if (vals.length === 0) return null;
  if (mode === "include") {
    if (vals.length === 1) {
      return {
        field,
        operator: "eq",
        value: vals[0] as unknown as VqlConditionInput["value"],
      };
    }
    return {
      field,
      operator: "in",
      value: vals as unknown as VqlConditionInput["value"],
    };
  }
  if (vals.length === 1) {
    return {
      field,
      operator: "ne",
      value: vals[0] as unknown as VqlConditionInput["value"],
    };
  }
  return {
    field,
    operator: "nin",
    value: vals as unknown as VqlConditionInput["value"],
  };
}

/** Build VQL filter from sidebar facet include/exclude maps. */
export function buildCompanyFacetVqlFilter(
  facetValues: Record<string, string[]>,
  excludedFacetValues: Record<string, string[]> = {},
): VqlFilterInput | undefined {
  const parts: VqlFilterInput[] = [];
  const keys = new Set([
    ...Object.keys(facetValues),
    ...Object.keys(excludedFacetValues),
  ]);

  for (const key of keys) {
    if (isCompanyRangeBucketFacet(key)) {
      const include = companyRangeBucketTokensToIncludeVql(
        key,
        trimValues(facetValues[key]),
      );
      if (include) parts.push(include);
      const exclude = companyRangeBucketTokensToExcludeVql(
        key,
        trimValues(excludedFacetValues[key]),
      );
      if (exclude) parts.push(exclude);
      continue;
    }

    const vqlField = companyFacetVqlField(key);
    const conditions: VqlConditionInput[] = [];
    const include = facetCondition(
      vqlField,
      trimValues(facetValues[key]),
      "include",
    );
    if (include) conditions.push(include);
    const exclude = facetCondition(
      vqlField,
      trimValues(excludedFacetValues[key]),
      "exclude",
    );
    if (exclude) conditions.push(exclude);
    if (conditions.length > 0) {
      parts.push({ conditions });
    }
  }

  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { allOf: parts };
}

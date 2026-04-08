import type {
  VqlConditionInput,
  VqlFilterInput,
  VqlQueryInput,
} from "@/graphql/generated/types";

/**
 * Builds `VqlQueryInput` for `companies(query)` with optional name search merged into `filters`.
 */
export function buildCompanyListVql(
  page: number,
  pageSize: number,
  search: string,
  extra: Partial<VqlQueryInput>,
): VqlQueryInput {
  const offset = (page - 1) * pageSize;
  const trimmed = search.trim();
  const searchBlock: VqlFilterInput | undefined = trimmed
    ? {
        conditions: [
          {
            field: "name",
            operator: "contains",
            value: trimmed as unknown as VqlConditionInput["value"],
          },
        ],
      }
    : undefined;

  const baseFilters = extra.filters as VqlFilterInput | undefined;
  let filters: VqlFilterInput | undefined;
  if (searchBlock && baseFilters) {
    filters = { allOf: [searchBlock, baseFilters] };
  } else if (searchBlock) {
    filters = searchBlock;
  } else {
    filters = baseFilters;
  }

  return {
    ...(extra as VqlQueryInput),
    limit: pageSize,
    offset,
    filters,
  };
}

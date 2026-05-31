import type {
  VqlConditionInput,
  VqlFilterInput,
  VqlOrderByInput,
  VqlQueryInput,
} from "@/graphql/generated/types";
import { companySearchTokensFromString } from "@/lib/companySearchTokens";

function sortByToCompanyOrderBy(sortBy: string): VqlOrderByInput[] {
  switch (sortBy) {
    case "oldest":
      return [{ orderBy: "createdAt", orderDirection: "asc" }];
    case "name_asc":
      return [{ orderBy: "name", orderDirection: "asc" }];
    case "name_desc":
      return [{ orderBy: "name", orderDirection: "desc" }];
    default:
      return [{ orderBy: "createdAt", orderDirection: "desc" }];
  }
}

/**
 * Builds `VqlQueryInput` for `companies(query)` with optional name search merged into `filters`.
 * When `extra.orderBy` is set (e.g. advanced VQL builder), it wins over `opts.sortBy`.
 */
export function buildCompanyListVql(
  page: number,
  pageSize: number,
  search: string,
  extra: Partial<VqlQueryInput>,
  opts?: { searchAfter?: string[] | null; sortBy?: string },
): VqlQueryInput {
  const useCursor = !!opts?.searchAfter?.length;
  const offset = useCursor ? 0 : (page - 1) * pageSize;
  const tokens = companySearchTokensFromString(search);
  const searchBlock: VqlFilterInput | undefined =
    tokens.length === 0
      ? undefined
      : tokens.length === 1
        ? {
            conditions: [
              {
                field: "name",
                operator: "contains",
                value: tokens[0] as unknown as VqlConditionInput["value"],
              },
            ],
          }
        : {
            allOf: tokens.map((token) => ({
              conditions: [
                {
                  field: "name",
                  operator: "contains",
                  value: token as unknown as VqlConditionInput["value"],
                },
              ],
            })),
          };

  const baseFilters = extra.filters as VqlFilterInput | undefined;
  let filters: VqlFilterInput | undefined;
  if (searchBlock && baseFilters) {
    filters = { allOf: [searchBlock, baseFilters] };
  } else if (searchBlock) {
    filters = searchBlock;
  } else {
    filters = baseFilters;
  }

  const {
    searchAfter: _searchAfter,
    orderBy: extraOrderBy,
    ...rest
  } = extra as VqlQueryInput;
  const orderBy =
    extraOrderBy != null && extraOrderBy.length > 0
      ? extraOrderBy
      : sortByToCompanyOrderBy(opts?.sortBy ?? "newest");

  return {
    ...(rest as VqlQueryInput),
    limit: pageSize,
    offset,
    orderBy,
    ...(useCursor && opts?.searchAfter?.length
      ? { searchAfter: opts.searchAfter }
      : {}),
    filters,
  };
}

/**
 * GraphQL `companyCount` input: same merged filters as {@link buildCompanyListVql}
 * (toolbar search + facets), without pagination or cursor — matches Connectra cohort for totals.
 */
export function buildCompanyCountQueryInput(
  search: string,
  extra: Partial<VqlQueryInput>,
  sortBy: string,
): VqlQueryInput {
  const merged = buildCompanyListVql(1, 25, search, extra, {
    sortBy,
    searchAfter: null,
  });
  return { filters: merged.filters };
}

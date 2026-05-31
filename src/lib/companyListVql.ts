import type {
  VqlConditionInput,
  VqlFilterInput,
  VqlOrderByInput,
  VqlQueryInput,
} from "@/graphql/generated/types";
import { companySearchTokensFromString } from "@/lib/companySearchTokens";

/** Sort keys for companies list / table (server-side via Connectra `order_by`). */
export type CompanyListSortBy =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "employees_asc"
  | "employees_desc"
  | "location_asc"
  | "location_desc"
  | "domain_asc"
  | "domain_desc"
  | "contacts_asc"
  | "contacts_desc";

const COMPANY_LIST_SORT_KEYS = new Set<string>([
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
  "employees_asc",
  "employees_desc",
  "location_asc",
  "location_desc",
  "domain_asc",
  "domain_desc",
  "contacts_asc",
  "contacts_desc",
]);

export function isCompanyListSortBy(value: string): value is CompanyListSortBy {
  return COMPANY_LIST_SORT_KEYS.has(value);
}

function sortByToCompanyOrderBy(sortBy: string): VqlOrderByInput[] {
  switch (sortBy) {
    case "oldest":
      return [{ orderBy: "createdAt", orderDirection: "asc" }];
    case "name_asc":
      return [{ orderBy: "name", orderDirection: "asc" }];
    case "name_desc":
      return [{ orderBy: "name", orderDirection: "desc" }];
    case "employees_asc":
      return [{ orderBy: "employeesCount", orderDirection: "asc" }];
    case "employees_desc":
      return [{ orderBy: "employeesCount", orderDirection: "desc" }];
    case "location_asc":
      return [
        { orderBy: "country", orderDirection: "asc" },
        { orderBy: "state", orderDirection: "asc" },
        { orderBy: "city", orderDirection: "asc" },
      ];
    case "location_desc":
      return [
        { orderBy: "country", orderDirection: "desc" },
        { orderBy: "state", orderDirection: "desc" },
        { orderBy: "city", orderDirection: "desc" },
      ];
    case "domain_asc":
      return [{ orderBy: "normalizedDomain", orderDirection: "asc" }];
    case "domain_desc":
      return [{ orderBy: "normalizedDomain", orderDirection: "desc" }];
    case "contacts_asc":
      return [{ orderBy: "contactCount", orderDirection: "asc" }];
    case "contacts_desc":
      return [{ orderBy: "contactCount", orderDirection: "desc" }];
    case "newest":
      return [{ orderBy: "createdAt", orderDirection: "desc" }];
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

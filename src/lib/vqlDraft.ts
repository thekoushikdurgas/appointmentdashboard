/**
 * Draft VQL model for the advanced builder → GraphQL VqlQueryInput fragments.
 */

import type {
  PopulateConfigInput,
  VqlConditionInput,
  VqlFilterInput,
  VqlOrderByInput,
  VqlQueryInput,
} from "@/graphql/generated/types";

/** GraphQL may not yet include these on generated types — API accepts them. */
export type VqlConditionInputExt = VqlConditionInput & {
  searchType?: string;
  slop?: number;
  fuzzy?: boolean;
  matchOperator?: string;
};

export interface DraftCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  searchType?: "exact" | "shuffle" | "substring";
  slop?: number;
  fuzzy?: boolean;
  matchOperator?: "and" | "or";
}

export interface DraftGroup {
  id: string;
  logic: "and" | "or";
  items: Array<DraftCondition | DraftGroup>;
}

export interface DraftSort {
  field: string;
  direction: "asc" | "desc";
}

export interface DraftQuery {
  rootGroup: DraftGroup;
  sort: DraftSort[];
  selectColumns: string[];
  companyPopulate: boolean;
  companySelectColumns: string[];
}

let _draftId = 0;
function nextId(prefix: string): string {
  _draftId += 1;
  return `${prefix}-${_draftId}`;
}

export function emptyDraftGroup(logic: "and" | "or" = "and"): DraftGroup {
  return { id: nextId("g"), logic, items: [] };
}

export function emptyDraftQuery(): DraftQuery {
  return {
    rootGroup: emptyDraftGroup("and"),
    sort: [],
    selectColumns: [],
    companyPopulate: false,
    companySelectColumns: [],
  };
}

export function emptyDraftCondition(): DraftCondition {
  return {
    id: nextId("c"),
    field: "",
    operator: "eq",
    value: "",
  };
}

/** UI operators → API / vql_converter operators */
function mapOperatorToApi(op: string): string {
  const m: Record<string, string> = {
    equals: "eq",
    not_equals: "ne",
    neq: "ne",
    contains: "contains",
    not_contains: "ncontains",
    exact: "exact",
    starts_with: "starts_with",
    in_list: "in",
    not_in_list: "nin",
    gte: "gte",
    lte: "lte",
    gt: "gt",
    lt: "lt",
    between: "between",
  };
  return m[op] ?? op;
}

function draftConditionToVql(
  c: DraftCondition,
  _entityType: "contact" | "company",
): VqlConditionInputExt | null {
  if (!c.field.trim()) return null;
  const op = mapOperatorToApi(c.operator);
  let value: unknown = c.value;
  if (op === "in" || op === "nin") {
    value = c.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const row: VqlConditionInputExt = {
    field: c.field.trim(),
    operator: op,
    value: value as VqlConditionInput["value"],
  };
  if (c.searchType) row.searchType = c.searchType;
  if (c.slop != null) row.slop = c.slop;
  if (c.fuzzy != null) row.fuzzy = c.fuzzy;
  if (c.matchOperator) row.matchOperator = c.matchOperator;
  return row;
}

function itemToVqlFilter(
  item: DraftCondition | DraftGroup,
  entityType: "contact" | "company",
): VqlFilterInput | null {
  if ("field" in item) {
    const c = draftConditionToVql(item, entityType);
    return c ? { conditions: [c] } : null;
  }
  return draftGroupToVqlFilter(item, entityType) ?? null;
}

/** Recursively convert a draft group to ``VqlFilterInput`` (nested AND/OR). */
export function draftGroupToVqlFilter(
  group: DraftGroup,
  entityType: "contact" | "company",
): VqlFilterInput | undefined {
  if (group.logic === "and") {
    const parts: VqlFilterInput[] = [];
    for (const it of group.items) {
      const f = itemToVqlFilter(it, entityType);
      if (f) parts.push(f);
    }
    if (parts.length === 0) return undefined;
    if (parts.length === 1) return parts[0];
    return { allOf: parts };
  }
  const branches: VqlFilterInput[] = [];
  for (const it of group.items) {
    const f = itemToVqlFilter(it, entityType);
    if (f) branches.push(f);
  }
  if (branches.length === 0) return undefined;
  if (branches.length === 1) return branches[0];
  return { anyOf: branches };
}

/** Count non-empty condition rows in a group tree. */
export function countDraftConditions(group: DraftGroup): number {
  let n = 0;
  for (const it of group.items) {
    if ("field" in it) {
      if (it.field.trim()) n += 1;
    } else {
      n += countDraftConditions(it);
    }
  }
  return n;
}

/** True if the builder has anything worth applying (filter, sort, columns, company). */
export function draftHasBuilderPayload(draft: DraftQuery): boolean {
  return (
    countDraftConditions(draft.rootGroup) > 0 ||
    draft.sort.length > 0 ||
    draft.selectColumns.length > 0 ||
    draft.companyPopulate
  );
}

/** Best-effort restore from a saved ``VqlQueryInput`` (flat ``conditions`` only). */
export function vqlQueryInputToDraft(
  input: Partial<VqlQueryInput> | null | undefined,
): DraftQuery {
  const d = emptyDraftQuery();
  if (!input) return d;
  const ob = input.orderBy;
  if (ob?.length) {
    d.sort = ob.map((o) => ({
      field: o.orderBy,
      direction: (o.orderDirection === "asc" ? "asc" : "desc") as
        | "asc"
        | "desc",
    }));
  }
  if (input.selectColumns?.length) d.selectColumns = [...input.selectColumns];
  if (input.companyConfig?.populate) {
    d.companyPopulate = true;
    d.companySelectColumns = input.companyConfig.selectColumns
      ? [...input.companyConfig.selectColumns]
      : [];
  }
  const walkFilter = (f: VqlFilterInput | null | undefined): void => {
    if (!f) return;
    if (f.conditions?.length) {
      for (const c of f.conditions) {
        const row: DraftCondition = {
          id: nextId("c"),
          field: c.field,
          operator: c.operator,
          value:
            typeof c.value === "string" || typeof c.value === "number"
              ? String(c.value)
              : Array.isArray(c.value)
                ? (c.value as unknown[]).join(", ")
                : c.value != null
                  ? JSON.stringify(c.value)
                  : "",
        };
        const ext = c as VqlConditionInputExt;
        if (ext.searchType)
          row.searchType = ext.searchType as DraftCondition["searchType"];
        if (ext.slop != null) row.slop = ext.slop;
        if (ext.fuzzy != null) row.fuzzy = ext.fuzzy;
        if (ext.matchOperator)
          row.matchOperator = ext.matchOperator as "and" | "or";
        if (row.field.trim()) d.rootGroup.items.push(row);
      }
    }
    if (f.allOf?.length) for (const sub of f.allOf) walkFilter(sub);
    if (f.anyOf?.length) for (const sub of f.anyOf) walkFilter(sub);
  };
  walkFilter(input.filters ?? undefined);
  return d;
}

const ORDER_FIELD_ALIASES: Record<string, Record<string, string>> = {
  contact: {
    createdAt: "created_at",
    updatedAt: "updated_at",
    firstName: "first_name",
    lastName: "last_name",
    emailStatus: "email_status",
    linkedinUrl: "linkedin_url",
    mobilePhone: "mobile_phone",
    companyId: "company_id",
  },
  company: {
    createdAt: "created_at",
    updatedAt: "updated_at",
    employeeCount: "employees_count",
    employeesCount: "employees_count",
    normalizedDomain: "normalized_domain",
    linkedinUrl: "linkedin_url",
    annualRevenue: "annual_revenue",
    totalFunding: "total_funding",
  },
};

function normalizeSortField(
  field: string,
  entityType: "contact" | "company",
): string {
  const a = ORDER_FIELD_ALIASES[entityType];
  return a[field] ?? field;
}

export function draftToVqlQueryInput(
  draft: DraftQuery,
  entityType: "contact" | "company",
): Partial<VqlQueryInput> {
  const filters = draftGroupToVqlFilter(draft.rootGroup, entityType);
  const orderBy: VqlOrderByInput[] | undefined =
    draft.sort.length > 0
      ? draft.sort.map((s) => ({
          orderBy: normalizeSortField(s.field, entityType),
          orderDirection: s.direction,
        }))
      : undefined;
  const companyConfig: PopulateConfigInput | undefined =
    entityType === "contact" && draft.companyPopulate
      ? {
          populate: true,
          selectColumns:
            draft.companySelectColumns.length > 0
              ? draft.companySelectColumns
              : undefined,
        }
      : undefined;
  const out: Partial<VqlQueryInput> = {};
  if (filters) out.filters = filters;
  if (orderBy) out.orderBy = orderBy;
  if (draft.selectColumns.length > 0) out.selectColumns = draft.selectColumns;
  if (companyConfig) out.companyConfig = companyConfig;
  return out;
}

/** Map legacy flat VQLQuery (from old builder) to DraftQuery for modal init. */
export function legacyVqlQueryToDraft(
  query: {
    filters?: { and?: unknown[]; or?: unknown[] };
  } | null,
): DraftQuery {
  const d = emptyDraftQuery();
  if (!query?.filters) return d;
  const and = (query.filters.and as DraftCondition[] | undefined)?.filter(
    (c) => c && typeof c === "object" && "field" in c && String(c.field).trim(),
  );
  const or = (query.filters.or as DraftCondition[] | undefined)?.filter(
    (c) => c && typeof c === "object" && "field" in c && String(c.field).trim(),
  );
  if (and?.length) {
    d.rootGroup.logic = "and";
    d.rootGroup.items = and.map((c) => ({ ...c, id: c.id || nextId("c") }));
  } else if (or?.length) {
    d.rootGroup.logic = "or";
    d.rootGroup.items = or.map((c) => ({ ...c, id: c.id || nextId("c") }));
  }
  return d;
}

export function draftQueryToFilterInput(
  draft: DraftQuery,
  entityType: "contact" | "company",
): VqlFilterInput | undefined {
  return draftGroupToVqlFilter(draft.rootGroup, entityType);
}

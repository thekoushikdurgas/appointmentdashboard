import type { DraftCondition } from "@/lib/vqlDraft";
import { emptyDraftCondition } from "@/lib/vqlDraft";
import { contactVqlFieldForFacetFilterKey } from "@/lib/contactFacetVql";
import { normalizeEmailStatusFilterValues } from "@/lib/contactEmailStatus";

function trimValues(vals: string[] | undefined): string[] {
  if (!vals?.length) return [];
  return vals.map((v) => String(v).trim()).filter(Boolean);
}

function normalizeFacetValues(field: string, vals: string[]): string[] {
  if (field === "email_status") {
    return normalizeEmailStatusFilterValues(vals);
  }
  return vals;
}

function sidebarCond(
  field: string,
  operator: string,
  value: string,
): DraftCondition {
  const c = emptyDraftCondition();
  return { ...c, field, operator, value };
}

/** Include: single `eq`, multiple `in_list` → `in`. */
export function contactFacetIncludeDraftCondition(
  filterKey: string,
  values: string[],
  displayName?: string | null,
): DraftCondition | null {
  const trimmed = trimValues(values);
  if (trimmed.length === 0) return null;
  const field = contactVqlFieldForFacetFilterKey(filterKey, displayName);
  const vals = normalizeFacetValues(field, trimmed);
  if (vals.length === 0) return null;
  if (vals.length === 1) return sidebarCond(field, "eq", vals[0]);
  const c = emptyDraftCondition();
  return { ...c, field, operator: "in_list", value: vals.join(",") };
}

/** Exclude: single `ne`, multiple `not_in_list` → `nin`. */
export function contactFacetExcludeDraftCondition(
  filterKey: string,
  values: string[],
  displayName?: string | null,
): DraftCondition | null {
  const trimmed = trimValues(values);
  if (trimmed.length === 0) return null;
  const field = contactVqlFieldForFacetFilterKey(filterKey, displayName);
  const vals = normalizeFacetValues(field, trimmed);
  if (vals.length === 0) return null;
  if (vals.length === 1) return sidebarCond(field, "ne", vals[0]);
  const c = emptyDraftCondition();
  return { ...c, field, operator: "not_in_list", value: vals.join(",") };
}

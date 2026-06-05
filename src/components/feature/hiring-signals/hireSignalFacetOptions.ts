import type { ContactFilterData } from "@/graphql/generated/types";
import { sortHireSignalFacetOptionsByCount } from "@/components/feature/hiring-signals/hireSignalFacetSort";

export type HireSignalFacetRowInput = {
  value: string;
  count?: number | null;
  displayValue?: string;
};

function normalizeFacetCount(count: number | null | undefined): number {
  if (typeof count === "number" && Number.isFinite(count)) return count;
  return 0;
}

/** Map API facet rows to combobox options; always includes numeric count (including 0). */
export function mapHireSignalFacetRows(
  rows: HireSignalFacetRowInput[],
  formatLabel?: (value: string) => string,
): ContactFilterData[] {
  return rows.map((r) => {
    const value = String(r.value ?? "").trim();
    const displayValue = formatLabel
      ? formatLabel(r.displayValue && r.displayValue !== r.value ? r.displayValue : value)
      : (r.displayValue ?? value);
    return {
      value,
      displayValue,
      count: normalizeFacetCount(r.count),
    };
  });
}

/** Dedupe by value (first wins), then sort by job count desc. */
export function mergeAndSortHireSignalFacetOptions(
  prev: ContactFilterData[],
  next: ContactFilterData[],
  keyFn: (row: ContactFilterData) => string = (row) =>
    String(row.value ?? "").trim().toLowerCase(),
): ContactFilterData[] {
  const seen = new Set<string>();
  const out: ContactFilterData[] = [];
  for (const row of [...prev, ...next]) {
    const key = keyFn(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return sortHireSignalFacetOptionsByCount(out);
}

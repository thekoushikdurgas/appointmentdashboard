import type { ContactFilterData } from "@/graphql/generated/types";

/** Sort facet rows by job count (desc), then label. */
export function sortHireSignalFacetOptionsByCount(
  rows: ContactFilterData[],
): ContactFilterData[] {
  return [...rows].sort((a, b) => {
    const ca = typeof a.count === "number" ? a.count : 0;
    const cb = typeof b.count === "number" ? b.count : 0;
    if (cb !== ca) return cb - ca;
    const la = String(a.displayValue ?? a.value ?? "");
    const lb = String(b.displayValue ?? b.value ?? "");
    return la.localeCompare(lb, undefined, { sensitivity: "base" });
  });
}

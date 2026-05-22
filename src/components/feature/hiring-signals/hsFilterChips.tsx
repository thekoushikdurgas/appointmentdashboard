"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type HsFilterChipItem = {
  key: string;
  label: string;
  onRemove: () => void;
};

export function pickHsFilterChipsByKeyPrefix(
  items: HsFilterChipItem[],
  prefixes: readonly string[],
): HsFilterChipItem[] {
  if (prefixes.length === 0) return [];
  return items.filter((c) => prefixes.some((p) => c.key.startsWith(p)));
}

export function HsFilterChipList({
  items,
  variant = "default",
}: {
  items: HsFilterChipItem[];
  variant?: "default" | "section";
}) {
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        "c360-hs-filter-chips",
        variant === "section" && "c360-hs-filter-chips--section",
      )}
      role="list"
    >
      {items.map((c) => (
        <span key={c.key} className="c360-hs-filter-chip" role="listitem">
          <span className="c360-hs-filter-chip__text">{c.label}</span>
          <button
            type="button"
            className="c360-hs-filter-chip__remove"
            aria-label={`Remove ${c.label}`}
            onClick={c.onRemove}
          >
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}

/** Key prefixes from `buildHiringSignalChipBuckets` company cohort chips. */
export const HS_COMPANY_FILTER_CHIP_PREFIXES = {
  name: ["co-name"],
  country: ["co-country"],
  industry: ["co-industry"],
  employeeSize: ["co-emp-size"],
  revenue: ["co-rev", "co-facet-annual_revenue"],
  funding: ["co-fund"],
} as const;

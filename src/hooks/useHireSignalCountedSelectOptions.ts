"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildHireSignalFacetOptionBase } from "@/components/feature/hiring-signals/hireSignalFacetOptionBase";
import type { HiringSignalFilterDraft } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import type { SelectOption } from "@/components/ui/Select";
import { sortSelectOptionsByCount } from "@/components/ui/Select";
import type {
  HireSignalEnumFilterField,
  JobListFilters,
} from "@/services/graphql/hiringSignalService";
import { fetchHireSignalJobFilterOptions } from "@/services/graphql/hiringSignalService";

export type HireSignalStaticSelectOption = {
  value: string;
  label: string;
};

function mergeCountedSelectOptions(
  staticOptions: HireSignalStaticSelectOption[],
  countsByValue: Map<string, number>,
): SelectOption[] {
  const merged: SelectOption[] = staticOptions.map((opt) => {
    const key = opt.value.trim();
    const count = key ? countsByValue.get(key) : undefined;
    return {
      value: opt.value,
      label: opt.label,
      count: typeof count === "number" ? count : key ? 0 : undefined,
    };
  });
  return sortSelectOptionsByCount(merged);
}

/**
 * Loads job counts for static hiring-signals sidebar Select options; refetches when filters change.
 */
export function useHireSignalCountedSelectOptions(
  field: HireSignalEnumFilterField,
  staticOptions: HireSignalStaticSelectOption[],
  appliedListFilters: JobListFilters,
  draft: HiringSignalFilterDraft,
  signalTimePreset: "all" | "new_7d",
  enabled = true,
): { options: SelectOption[]; loading: boolean } {
  const [options, setOptions] = useState<SelectOption[]>(staticOptions);
  const [loading, setLoading] = useState(false);
  const reqRef = useRef(0);

  const filterBase = useMemo(
    () =>
      buildHireSignalFacetOptionBase(
        appliedListFilters,
        draft,
        signalTimePreset,
      ),
    [appliedListFilters, draft, signalTimePreset],
  );

  const staticKey = useMemo(
    () => staticOptions.map((o) => `${o.value}:${o.label}`).join("|"),
    [staticOptions],
  );

  useEffect(() => {
    if (!enabled) {
      setOptions(staticOptions);
      setLoading(false);
      return;
    }
    const req = ++reqRef.current;
    const timer = setTimeout(() => {
      setLoading(true);
      const countable = staticOptions.filter((o) => o.value.trim() !== "");
      void fetchHireSignalJobFilterOptions(field, filterBase, {
        limit: Math.max(countable.length, 50),
        offset: 0,
      })
        .then((rows) => {
          if (req !== reqRef.current) return;
          const counts = new Map<string, number>();
          for (const row of rows) {
            const k = String(row.value ?? "").trim();
            if (!k) continue;
            counts.set(k, typeof row.count === "number" ? row.count : 0);
          }
          setOptions(mergeCountedSelectOptions(staticOptions, counts));
        })
        .catch(() => {
          if (req === reqRef.current) setOptions(staticOptions);
        })
        .finally(() => {
          if (req === reqRef.current) setLoading(false);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [enabled, field, filterBase, staticKey, staticOptions]);

  return { options, loading };
}

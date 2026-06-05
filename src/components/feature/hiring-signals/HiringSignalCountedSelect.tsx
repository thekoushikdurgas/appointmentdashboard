"use client";

import { Select, type SelectProps } from "@/components/ui/Select";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import { useHireSignalCountedSelectOptions } from "@/hooks/useHireSignalCountedSelectOptions";
import type { HireSignalEnumFilterField } from "@/services/graphql/hiringSignalService";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";
import type { HireSignalStaticSelectOption } from "@/hooks/useHireSignalCountedSelectOptions";

export interface HiringSignalCountedSelectProps extends Omit<
  SelectProps,
  "options"
> {
  field: HireSignalEnumFilterField;
  staticOptions: HireSignalStaticSelectOption[];
  appliedListFilters: JobListFilters;
  signalTimePreset: "all" | "new_7d";
}

/** Inline Select with job counts loaded from hireSignal.jobFilterOptions. */
export function HiringSignalCountedSelect({
  field,
  staticOptions,
  appliedListFilters,
  signalTimePreset,
  disabled,
  ...selectProps
}: HiringSignalCountedSelectProps) {
  const { draft } = useHireSignalFilter();
  const { options } = useHireSignalCountedSelectOptions(
    field,
    staticOptions,
    appliedListFilters,
    draft,
    signalTimePreset,
    !disabled,
  );

  return (
    <Select
      {...selectProps}
      menuVariant="inline"
      options={options}
      disabled={disabled}
    />
  );
}

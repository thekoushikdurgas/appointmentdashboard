"use client";

import { HiringSignalTextFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalTextFacetCombobox";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";

export interface HiringSignalCompanyNameFacetComboboxProps {
  appliedListFilters: JobListFilters;
  signalTimePreset: "all" | "new_7d";
  label: string;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  disabled?: boolean;
}

/**
 * Company filters — distinct employer names on job postings with OpenSearch doc counts.
 * Selections resolve to Connectra `name` eq/in, then jobs filter by `company_uuid` / `excluded_company_uuid`.
 */
export function HiringSignalCompanyNameFacetCombobox({
  appliedListFilters,
  signalTimePreset,
  label,
  selectedValues,
  onSelectionChange,
  disabled = false,
}: HiringSignalCompanyNameFacetComboboxProps) {
  const { draft } = useHireSignalFilter();

  /** Do not scope facet options by resolved cohort UUIDs — show all employers with job counts. */
  const facetScopeFilters: JobListFilters = {
    ...appliedListFilters,
    companyUuids: undefined,
    excludedCompanyUuids: undefined,
  };

  return (
    <HiringSignalTextFacetCombobox
      field="company"
      label={label}
      draft={draft}
      appliedListFilters={facetScopeFilters}
      signalTimePreset={signalTimePreset}
      selectedValues={selectedValues}
      onSelectionChange={onSelectionChange}
      disabled={disabled}
      pageSize={50}
    />
  );
}

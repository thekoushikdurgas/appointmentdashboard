"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import type { ContactFilterData } from "@/graphql/generated/types";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import { buildHireSignalCompanyFacetOptionBase } from "@/components/feature/hiring-signals/hireSignalCompanyFacetOptionBase";
import { normalizeHiringSignalTokenList } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import { formatCompanyEmployeeSizeBucketLabel } from "@/lib/hireSignalCompanyEmployeeSizeBuckets";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";
import { fetchHireSignalCompanyEmployeeSizeFilterOptions } from "@/services/graphql/hiringSignalService";

export interface HiringSignalCompanyEmployeeSizeFacetComboboxProps {
  appliedListFilters: JobListFilters;
  signalTimePreset: "all" | "new_7d";
  label: string;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  disabled?: boolean;
}

/**
 * Fixed employee-size ranges from Connectra `employees_count` for job employers, with job counts (job.server).
 */
export function HiringSignalCompanyEmployeeSizeFacetCombobox({
  appliedListFilters,
  signalTimePreset,
  label,
  selectedValues,
  onSelectionChange,
  disabled = false,
}: HiringSignalCompanyEmployeeSizeFacetComboboxProps) {
  const { draft } = useHireSignalFilter();
  const [searchText, setSearchText] = useState("");
  const [options, setOptions] = useState<ContactFilterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadReqRef = useRef(0);

  const runFetch = useCallback(async () => {
    const req = ++loadReqRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const base = buildHireSignalCompanyFacetOptionBase(
        appliedListFilters,
        draft,
        signalTimePreset,
        { excludeSelfFirmographicDimension: "employeeSize" },
      );
      const rows = await fetchHireSignalCompanyEmployeeSizeFilterOptions(base, {
        q: searchText,
        limit: 20,
        offset: 0,
      });
      if (req !== loadReqRef.current) return;
      const mapped: ContactFilterData[] = rows.map((r) => ({
        value: r.value,
        displayValue: formatCompanyEmployeeSizeBucketLabel(r.value),
        count: typeof r.count === "number" ? r.count : undefined,
      }));
      setOptions(mapped);
    } catch (e) {
      if (req === loadReqRef.current) {
        const msg =
          e instanceof Error
            ? e.message
            : "Failed to load employee size options";
        setLoadError(msg);
        setOptions([]);
      }
    } finally {
      if (req === loadReqRef.current) setLoading(false);
    }
  }, [appliedListFilters, draft, searchText, signalTimePreset]);

  useEffect(() => {
    const t = setTimeout(() => {
      void runFetch();
    }, 280);
    return () => clearTimeout(t);
  }, [searchText, runFetch]);

  const onOpen = useCallback(() => {
    void runFetch();
  }, [runFetch]);

  return (
    <div className="c360-space-y-1">
      <FilterCombobox
        label={label}
        options={options}
        selectedValues={normalizeHiringSignalTokenList(selectedValues)}
        onSelectionChange={onSelectionChange}
        loading={loading}
        loadingMore={false}
        hasMore={false}
        onOpen={onOpen}
        onLoadMore={() => {}}
        searchText={searchText}
        onSearchChange={setSearchText}
        disabled={disabled}
      />
      {loadError && !loading && options.length === 0 ? (
        <p className="c360-text-2xs c360-text-destructive" title={loadError}>
          {loadError.length > 120 ? `${loadError.slice(0, 120)}…` : loadError}
        </p>
      ) : null}
      {!loadError && !loading && options.length === 0 ? (
        <p className="c360-text-2xs c360-text-ink-muted">
          No employee size buckets loaded. Redeploy job.server with
          company_employee_size support.
        </p>
      ) : null}
    </div>
  );
}

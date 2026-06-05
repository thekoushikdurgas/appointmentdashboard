"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import type { ContactFilterData } from "@/graphql/generated/types";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import { buildHireSignalCompanyFacetOptionBase } from "@/components/feature/hiring-signals/hireSignalCompanyFacetOptionBase";
import { normalizeHiringSignalTokenList } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import {
  formatCompanyEmployeesCountBucketLabel,
  formatCompanyFundingBucketLabel,
  formatCompanyRevenueBucketLabel,
} from "@/lib/companyRangeBuckets";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";
import {
  fetchHireSignalCompanyEmployeeSizeFilterOptions,
  fetchHireSignalCompanyFundingFilterOptions,
  fetchHireSignalCompanyRevenueFilterOptions,
  type HireSignalFirmographicFacetDimension,
} from "@/services/graphql/hiringSignalService";

export type HiringSignalCompanyBucketDimension =
  | "revenue"
  | "funding"
  | "employeeSize";

const BUCKET_CONFIG: Record<
  HiringSignalCompanyBucketDimension,
  {
    excludeSelfFirmographicDimension: HireSignalFirmographicFacetDimension;
    fetch: typeof fetchHireSignalCompanyRevenueFilterOptions;
    formatLabel: (id: string) => string;
    emptyHint: string;
    loadErrorLabel: string;
  }
> = {
  revenue: {
    excludeSelfFirmographicDimension: "revenue",
    fetch: fetchHireSignalCompanyRevenueFilterOptions,
    formatLabel: formatCompanyRevenueBucketLabel,
    emptyHint:
      "No revenue buckets loaded. Redeploy job.server with company_revenue bucket support.",
    loadErrorLabel: "Failed to load revenue options",
  },
  funding: {
    excludeSelfFirmographicDimension: "funding",
    fetch: fetchHireSignalCompanyFundingFilterOptions,
    formatLabel: formatCompanyFundingBucketLabel,
    emptyHint:
      "No funding buckets loaded. Redeploy job.server with company_funding bucket support.",
    loadErrorLabel: "Failed to load funding options",
  },
  employeeSize: {
    excludeSelfFirmographicDimension: "employeeSize",
    fetch: fetchHireSignalCompanyEmployeeSizeFilterOptions,
    formatLabel: formatCompanyEmployeesCountBucketLabel,
    emptyHint:
      "No employee size buckets loaded. Redeploy job.server with company_employee_size support.",
    loadErrorLabel: "Failed to load employee size options",
  },
};

export interface HiringSignalCompanyBucketFacetComboboxProps {
  dimension: HiringSignalCompanyBucketDimension;
  appliedListFilters: JobListFilters;
  signalTimePreset: "all" | "new_7d";
  label: string;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  disabled?: boolean;
}

/** Fixed Connectra firmographic bucket ranges for job employers, with job counts. */
export function HiringSignalCompanyBucketFacetCombobox({
  dimension,
  appliedListFilters,
  signalTimePreset,
  label,
  selectedValues,
  onSelectionChange,
  disabled = false,
}: HiringSignalCompanyBucketFacetComboboxProps) {
  const config = BUCKET_CONFIG[dimension];
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
        {
          excludeSelfFirmographicDimension:
            config.excludeSelfFirmographicDimension,
        },
      );
      const rows = await config.fetch(base, {
        q: searchText,
        limit: 20,
        offset: 0,
      });
      if (req !== loadReqRef.current) return;
      const mapped: ContactFilterData[] = rows.map((r) => ({
        value: r.value,
        displayValue: config.formatLabel(r.value),
        count: typeof r.count === "number" ? r.count : undefined,
      }));
      setOptions(mapped);
    } catch (e) {
      if (req === loadReqRef.current) {
        const msg = e instanceof Error ? e.message : config.loadErrorLabel;
        setLoadError(msg);
        setOptions([]);
      }
    } finally {
      if (req === loadReqRef.current) setLoading(false);
    }
  }, [appliedListFilters, config, draft, searchText, signalTimePreset]);

  useEffect(() => {
    if (disabled) return;
    const t = setTimeout(() => {
      void runFetch();
    }, 280);
    return () => clearTimeout(t);
  }, [searchText, runFetch, disabled]);

  const onOpen = useCallback(() => {
    if (disabled) return;
    void runFetch();
  }, [runFetch, disabled]);

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
        <p className="c360-text-2xs c360-text-ink-muted">{config.emptyHint}</p>
      ) : null}
    </div>
  );
}

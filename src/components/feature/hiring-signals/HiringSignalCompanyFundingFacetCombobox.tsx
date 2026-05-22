"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import type { ContactFilterData } from "@/graphql/generated/types";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import { buildHireSignalCompanyFacetOptionBase } from "@/components/feature/hiring-signals/hireSignalCompanyFacetOptionBase";
import { normalizeHiringSignalTokenList } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import { formatCompanyFundingBucketLabel } from "@/lib/hireSignalCompanyFundingBuckets";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";
import { fetchHireSignalCompanyFundingFilterOptions } from "@/services/graphql/hiringSignalService";

export interface HiringSignalCompanyFundingFacetComboboxProps {
  appliedListFilters: JobListFilters;
  signalTimePreset: "all" | "new_7d";
  label: string;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  disabled?: boolean;
}

/**
 * Fixed total_funding ranges on Connectra companies with job counts (job.server).
 */
export function HiringSignalCompanyFundingFacetCombobox({
  appliedListFilters,
  signalTimePreset,
  label,
  selectedValues,
  onSelectionChange,
  disabled = false,
}: HiringSignalCompanyFundingFacetComboboxProps) {
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
      );
      const rows = await fetchHireSignalCompanyFundingFilterOptions(base, {
        q: searchText,
        limit: 20,
        offset: 0,
      });
      if (req !== loadReqRef.current) return;
      const mapped: ContactFilterData[] = rows.map((r) => ({
        value: r.value,
        displayValue: formatCompanyFundingBucketLabel(r.value),
        count: typeof r.count === "number" ? r.count : undefined,
      }));
      setOptions(mapped);
    } catch (e) {
      if (req === loadReqRef.current) {
        const msg =
          e instanceof Error ? e.message : "Failed to load funding options";
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
          No funding buckets loaded. Redeploy job.server with company_funding
          bucket support.
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import type { ContactFilterData } from "@/graphql/generated/types";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import { buildHireSignalCompanyFacetOptionBase } from "@/components/feature/hiring-signals/hireSignalCompanyFacetOptionBase";
import { sortHireSignalFacetOptionsByCount } from "@/components/feature/hiring-signals/hireSignalFacetSort";
import { normalizeHiringSignalTokenList } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";
import { fetchHireSignalCompanyIndustryFilterOptions } from "@/services/graphql/hiringSignalService";

const DEFAULT_PAGE_SIZE = 50;

function formatCompanyIndustryLabel(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  return t
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export interface HiringSignalCompanyIndustryFacetComboboxProps {
  appliedListFilters: JobListFilters;
  signalTimePreset: "all" | "new_7d";
  label: string;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  disabled?: boolean;
}

/**
 * Job posting industries from linkedin_jobs_index (`industries.keyword`) with job counts (job.server).
 */
export function HiringSignalCompanyIndustryFacetCombobox({
  appliedListFilters,
  signalTimePreset,
  label,
  selectedValues,
  onSelectionChange,
  disabled = false,
}: HiringSignalCompanyIndustryFacetComboboxProps) {
  const { draft } = useHireSignalFilter();
  const [searchText, setSearchText] = useState("");
  const [options, setOptions] = useState<ContactFilterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const optionsLenRef = useRef(0);
  const loadReqRef = useRef(0);

  useEffect(() => {
    optionsLenRef.current = options.length;
  }, [options.length]);

  const runFetch = useCallback(
    async (mode: "replace" | "append") => {
      const req = ++loadReqRef.current;
      const offset = mode === "replace" ? 0 : optionsLenRef.current;
      if (mode === "replace") {
        setLoading(true);
        setHasMore(false);
        setLoadError(null);
      } else {
        setLoadingMore(true);
      }
      try {
        const base = buildHireSignalCompanyFacetOptionBase(
          appliedListFilters,
          draft,
          signalTimePreset,
          { excludeSelfFirmographicDimension: "industry" },
        );
        const rows = await fetchHireSignalCompanyIndustryFilterOptions(base, {
          q: searchText,
          limit: DEFAULT_PAGE_SIZE,
          offset,
        });
        if (req !== loadReqRef.current) return;
        const mapped: ContactFilterData[] = rows.map((r) => ({
          value: r.value,
          displayValue: formatCompanyIndustryLabel(
            r.displayValue && r.displayValue !== r.value
              ? r.displayValue
              : r.value,
          ),
          count: typeof r.count === "number" ? r.count : undefined,
        }));
        if (mode === "replace") {
          setOptions(sortHireSignalFacetOptionsByCount(mapped));
        } else {
          setOptions((prev) => {
            const seen = new Set(prev.map((p) => String(p.value)));
            const out = [...prev];
            for (const m of mapped) {
              const v = String(m.value);
              if (!seen.has(v)) {
                seen.add(v);
                out.push(m);
              }
            }
            return sortHireSignalFacetOptionsByCount(out);
          });
        }
        setHasMore(rows.length === DEFAULT_PAGE_SIZE);
      } catch (e) {
        if (req === loadReqRef.current) {
          const msg =
            e instanceof Error ? e.message : "Failed to load industry options";
          setLoadError(msg);
          if (mode === "replace") setOptions([]);
          setHasMore(false);
        }
      } finally {
        if (req === loadReqRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [appliedListFilters, draft, searchText, signalTimePreset],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      void runFetch("replace");
    }, 280);
    return () => clearTimeout(t);
  }, [searchText, runFetch]);

  const onOpen = useCallback(() => {
    void runFetch("replace");
  }, [runFetch]);

  const onLoadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) return;
    void runFetch("append");
  }, [hasMore, loading, loadingMore, runFetch]);

  return (
    <div className="c360-space-y-1">
      <FilterCombobox
        label={label}
        options={options}
        selectedValues={normalizeHiringSignalTokenList(selectedValues)}
        onSelectionChange={onSelectionChange}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onOpen={onOpen}
        onLoadMore={onLoadMore}
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
          No industries loaded. Redeploy job.server with company_industry
          support.
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import type { ContactFilterData } from "@/graphql/generated/types";
import { buildHireSignalFacetOptionBase } from "@/components/feature/hiring-signals/hireSignalFacetOptionBase";
import type { HiringSignalFilterDraft } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";
import {
  mapHireSignalFacetRows,
  mergeAndSortHireSignalFacetOptions,
} from "@/components/feature/hiring-signals/hireSignalFacetOptions";
import { sortHireSignalFacetOptionsByCount } from "@/components/feature/hiring-signals/hireSignalFacetSort";
import { formatDisplayLabel } from "@/lib/displayText";
import { fetchHireSignalJobFilterOptions } from "@/services/graphql/hiringSignalService";

const DEFAULT_PAGE_SIZE = 50;

export interface HiringSignalTextFacetComboboxProps {
  field: "title" | "company" | "location";
  label: string;
  draft: HiringSignalFilterDraft;
  appliedListFilters: JobListFilters;
  signalTimePreset: "all" | "new_7d";
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  disabled?: boolean;
  /** Distinct options per request (server max 200). Default 50 for infinite scroll pages. */
  pageSize?: number;
  className?: string;
}

export function HiringSignalTextFacetCombobox({
  field,
  label,
  draft,
  appliedListFilters,
  signalTimePreset,
  selectedValues,
  onSelectionChange,
  disabled = false,
  pageSize = DEFAULT_PAGE_SIZE,
  className,
}: HiringSignalTextFacetComboboxProps) {
  const [searchText, setSearchText] = useState("");
  const [options, setOptions] = useState<ContactFilterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
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
      } else {
        setLoadingMore(true);
      }
      try {
        const base = buildHireSignalFacetOptionBase(
          appliedListFilters,
          draft,
          signalTimePreset,
        );
        const rows = await fetchHireSignalJobFilterOptions(field, base, {
          q: searchText,
          limit: pageSize,
          offset,
        });
        if (req !== loadReqRef.current) return;
        const mapped = mapHireSignalFacetRows(rows, formatDisplayLabel);
        if (mode === "replace") {
          setOptions(sortHireSignalFacetOptionsByCount(mapped));
        } else {
          setOptions((prev) =>
            mergeAndSortHireSignalFacetOptions(prev, mapped),
          );
        }
        setHasMore(rows.length === pageSize);
      } catch {
        if (req === loadReqRef.current) {
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
    [appliedListFilters, draft, field, pageSize, searchText, signalTimePreset],
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
    <div className={className ?? "c360-space-y-2"}>
      <FilterCombobox
        label={label}
        options={options}
        selectedValues={selectedValues}
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
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import type { ContactFilterData } from "@/graphql/generated/types";
import {
  normalizeHiringSignalTokenList,
  resolveSalaryBoundsFromDraft,
  type HiringSignalFilterDraft,
} from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import { effectivePostedBounds } from "@/hooks/useHiringSignals";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";
import { fetchHireSignalJobFilterOptions } from "@/services/graphql/hiringSignalService";

const DEFAULT_PAGE_SIZE = 50;

function buildFacetOptionBase(
  applied: JobListFilters,
  draft: HiringSignalFilterDraft,
  preset: "all" | "new_7d",
): JobListFilters {
  const seniority =
    draft.seniorityCustom.trim() || draft.seniorityPreset.trim() || undefined;
  const functionCategory =
    draft.functionCustom.trim() || draft.functionPreset.trim() || undefined;
  const titles = normalizeHiringSignalTokenList(draft.titles);
  const companies = normalizeHiringSignalTokenList(draft.companies);
  const locations = normalizeHiringSignalTokenList(draft.locations);
  const draftPosted = draft.postedAfter.trim();
  const draftPostedBefore = draft.postedBefore.trim();

  const empMulti = normalizeHiringSignalTokenList(draft.employmentTypes);
  const empLegacy = draft.employmentType.trim();
  const employmentTypes =
    empMulti.length > 0 ? empMulti : empLegacy ? [empLegacy] : undefined;

  const workplaceTypes = normalizeHiringSignalTokenList(draft.workplaceTypes);
  const industries = normalizeHiringSignalTokenList(draft.industries);
  const excludedIndustries = normalizeHiringSignalTokenList(
    draft.excludedIndustries,
  );
  const excludedTitles = normalizeHiringSignalTokenList(draft.excludedTitles);
  const excludedCompanies = normalizeHiringSignalTokenList(
    draft.excludedCompanies,
  );
  const excludedLocations = normalizeHiringSignalTokenList(
    draft.excludedLocations,
  );
  const { salaryMin, salaryMax } = resolveSalaryBoundsFromDraft(draft);
  const experienceBuckets = normalizeHiringSignalTokenList(
    draft.experienceBuckets,
  );
  const roleTracks = normalizeHiringSignalTokenList(draft.roleTracks);
  const educationLevelMins = normalizeHiringSignalTokenList(
    draft.educationLevelMins,
  );
  const skillsAll = normalizeHiringSignalTokenList(draft.skillsAll);
  const clearanceRaw = draft.clearanceMode.trim().toLowerCase();
  const clearanceMode =
    clearanceRaw === "hide" || clearanceRaw === "only"
      ? clearanceRaw
      : undefined;

  return {
    ...applied,
    limit: applied.limit,
    offset: 0,
    titles: titles.length ? titles : undefined,
    companies: companies.length ? companies : undefined,
    locations: locations.length ? locations : undefined,
    employmentType: undefined,
    employmentTypes,
    workplaceTypes: workplaceTypes.length ? workplaceTypes : undefined,
    industries: industries.length ? industries : undefined,
    excludedIndustries: excludedIndustries.length
      ? excludedIndustries
      : undefined,
    excludedTitles: excludedTitles.length ? excludedTitles : undefined,
    excludedCompanies: excludedCompanies.length ? excludedCompanies : undefined,
    excludedLocations: excludedLocations.length ? excludedLocations : undefined,
    salaryMin,
    salaryMax,
    experienceBuckets: experienceBuckets.length ? experienceBuckets : undefined,
    roleTracks: roleTracks.length ? roleTracks : undefined,
    educationLevelMins: educationLevelMins.length
      ? educationLevelMins
      : undefined,
    skillsAll: skillsAll.length ? skillsAll : undefined,
    clearanceMode: clearanceMode || undefined,
    h1bOnly: draft.h1bOnly ? true : undefined,
    seniority,
    functionCategory,
    ...(() => {
      const bounds = effectivePostedBounds(preset, {
        postedAfter: draftPosted || applied.postedAfter,
        postedBefore: draftPostedBefore || applied.postedBefore,
      });
      return {
        postedAfter: bounds.postedAfter,
        postedBefore: bounds.postedBefore,
      };
    })(),
  };
}

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
        const base = buildFacetOptionBase(
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
        const mapped: ContactFilterData[] = rows.map((r) => ({
          value: r.value,
          displayValue: r.value,
          count: r.count > 0 ? r.count : undefined,
        }));
        if (mode === "replace") {
          setOptions(mapped);
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
            return out;
          });
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

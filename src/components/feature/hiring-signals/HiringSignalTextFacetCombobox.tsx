"use client";

import { useCallback, useEffect, useState } from "react";
import { FilterCombobox } from "@/components/ui/FilterCombobox";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { ContactFilterData } from "@/graphql/generated/types";
import {
  normalizeHiringSignalTokenList,
  type HiringSignalFilterDraft,
} from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import { effectivePostedAfter } from "@/hooks/useHiringSignals";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";
import { fetchHireSignalJobFilterOptions } from "@/services/graphql/hiringSignalService";

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

  const empMulti = normalizeHiringSignalTokenList(draft.employmentTypes);
  const empLegacy = draft.employmentType.trim();
  const employmentTypes =
    empMulti.length > 0
      ? empMulti
      : empLegacy
        ? [empLegacy]
        : undefined;

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
  const salaryRaw = draft.salaryMin.trim();
  const salaryParsed =
    salaryRaw.length > 0 ? Math.floor(Number(salaryRaw)) : NaN;
  const salaryMin =
    Number.isFinite(salaryParsed) && salaryParsed > 0 ? salaryParsed : undefined;
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
    excludedCompanies: excludedCompanies.length
      ? excludedCompanies
      : undefined,
    excludedLocations: excludedLocations.length
      ? excludedLocations
      : undefined,
    salaryMin,
    experienceBuckets: experienceBuckets.length
      ? experienceBuckets
      : undefined,
    roleTracks: roleTracks.length ? roleTracks : undefined,
    educationLevelMins: educationLevelMins.length
      ? educationLevelMins
      : undefined,
    skillsAll: skillsAll.length ? skillsAll : undefined,
    clearanceMode: clearanceMode || undefined,
    h1bOnly: draft.h1bOnly ? true : undefined,
    seniority,
    functionCategory,
    postedAfter: effectivePostedAfter(
      preset,
      draftPosted || applied.postedAfter,
    ),
    postedBefore:
      draft.postedBefore.trim() || applied.postedBefore || undefined,
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
}: HiringSignalTextFacetComboboxProps) {
  const [searchText, setSearchText] = useState("");
  const [customToken, setCustomToken] = useState("");
  const [options, setOptions] = useState<ContactFilterData[]>([]);
  const [loading, setLoading] = useState(false);

  const addCustomToken = useCallback(() => {
    const t = customToken.trim();
    if (!t) return;
    if (!selectedValues.includes(t)) {
      onSelectionChange([...selectedValues, t]);
    }
    setCustomToken("");
  }, [customToken, onSelectionChange, selectedValues]);

  const load = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const base = buildFacetOptionBase(
          appliedListFilters,
          draft,
          signalTimePreset,
        );
        const rows = await fetchHireSignalJobFilterOptions(field, base, {
          q,
          limit: 50,
        });
        setOptions(
          rows.map((r) => ({
            value: r.value,
            displayValue: r.count > 0 ? `${r.value} (${r.count})` : r.value,
          })),
        );
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [appliedListFilters, draft, field, signalTimePreset],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      void load(searchText);
    }, 280);
    return () => clearTimeout(t);
  }, [searchText, load]);

  const onOpen = useCallback(() => {
    void load(searchText);
  }, [load, searchText]);

  return (
    <div className="c360-space-y-2">
      <FilterCombobox
        label={label}
        options={options}
        selectedValues={selectedValues}
        onSelectionChange={onSelectionChange}
        loading={loading}
        hasMore={false}
        onOpen={onOpen}
        onLoadMore={() => {}}
        searchText={searchText}
        onSearchChange={setSearchText}
        disabled={disabled}
      />
      <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2">
        <Input
          type="text"
          inputSize="sm"
          className="c360-min-w-0 c360-flex-1"
          value={customToken}
          onChange={(e) => setCustomToken(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomToken();
            }
          }}
          placeholder="Custom value (substring match)"
          disabled={disabled}
          autoComplete="off"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !customToken.trim()}
          onClick={addCustomToken}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  DEFAULT_JOB_SORT_KEY,
  DEFAULT_JOB_SORT_ORDER,
  type JobListFilters,
} from "@/services/graphql/hiringSignalService";
import {
  EMPTY_HIRING_SIGNAL_DRAFT,
  normalizeHiringSignalTokenList,
  resolveSalaryBoundsFromDraft,
  type HiringSignalFilterDraft,
  type HiringSignalDraftField,
} from "@/components/feature/hiring-signals/hiringSignalFilterDraft";

const TOKEN_ARRAY_FIELDS = new Set<HiringSignalDraftField>([
  "titles",
  "companies",
  "companyNames",
  "excludedCompanyNames",
  "companyFunding",
  "excludedCompanyFunding",
  "companyCountries",
  "excludedCompanyCountries",
  "companyIndustries",
  "excludedCompanyIndustries",
  "companyEmployeeSizes",
  "excludedCompanyEmployeeSizes",
  "companyRevenue",
  "excludedCompanyRevenue",
  "locations",
  "employmentTypes",
  "workplaceTypes",
  "countries",
  "industries",
  "excludedIndustries",
  "excludedTitles",
  "excludedCompanies",
  "excludedLocations",
  "experienceBuckets",
  "roleTracks",
  "educationLevelMins",
  "skillsAll",
]);

/** Count of non-empty draft fields (toolbar / filter badge). */
export function countFilledDraftFields(d: HiringSignalFilterDraft): number {
  let n = 0;
  (Object.keys(d) as HiringSignalDraftField[]).forEach((k) => {
    if (k === "datePostedPreset" && d.datePostedPreset === "any") return;
    if (k === "salaryMin" || k === "salaryMax") {
      if (d.salaryPreset !== "custom") return;
    }
    if (k === "salaryPreset" && !d.salaryPreset.trim()) return;
    if (
      k === "postedAfter" &&
      d.datePostedPreset !== "any" &&
      d.datePostedPreset !== "custom"
    ) {
      return;
    }
    if (k === "companyFacetValues") {
      const facets = d.companyFacetValues;
      if (
        Object.values(facets).some(
          (arr) => Array.isArray(arr) && arr.some((x) => String(x).trim()),
        )
      ) {
        n += 1;
      }
      return;
    }
    const v = d[k];
    if (Array.isArray(v)) {
      if (normalizeHiringSignalTokenList(v).length > 0) n += 1;
    } else if (typeof v === "boolean") {
      if (v) n += 1;
    } else if (String(v).trim()) n += 1;
  });
  return n;
}

/** Toolbar / debounce: count all non-empty draft fields. */
export function effectiveHireSignalDraftFieldCount(
  d: HiringSignalFilterDraft,
): number {
  return countFilledDraftFields(d);
}

export interface HireSignalFilterContextValue {
  draft: HiringSignalFilterDraft;
  setDraft: React.Dispatch<React.SetStateAction<HiringSignalFilterDraft>>;
  onDraftField: (
    field: HiringSignalDraftField,
    value: string | string[] | boolean | Record<string, string[]>,
  ) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  /** Merge resume parser output into draft — applied filters update automatically. */
  mergeResumeSuggestions: (
    titles: string[],
    locations: string[],
    ext: Record<string, unknown>,
  ) => void;
  activeDraftCount: number;
  onCompanyFacetChange: (key: string, values: string[]) => void;
  /** Always-current draft for async company cohort resolution in `useHiringSignals`. */
  draftRef: MutableRefObject<HiringSignalFilterDraft>;
}

const HireSignalFilterContext =
  createContext<HireSignalFilterContextValue | null>(null);

export function HireSignalFilterProvider({
  children,
  setFilters,
  draftRef: draftRefProp,
}: {
  children: ReactNode;
  setFilters: React.Dispatch<React.SetStateAction<JobListFilters>>;
  draftRef?: MutableRefObject<HiringSignalFilterDraft>;
}) {
  const [draft, setDraft] = useState<HiringSignalFilterDraft>(
    EMPTY_HIRING_SIGNAL_DRAFT,
  );
  const internalDraftRef = useRef(draft);
  const draftRef = draftRefProp ?? internalDraftRef;
  draftRef.current = draft;

  const applyFilters = useCallback(() => {
    const titles = normalizeHiringSignalTokenList(draft.titles);
    const companies = normalizeHiringSignalTokenList(draft.companies);
    const locations = normalizeHiringSignalTokenList(draft.locations);

    const empMulti = normalizeHiringSignalTokenList(draft.employmentTypes);
    const empLegacy = draft.employmentType.trim();
    const employmentTypes =
      empMulti.length > 0 ? empMulti : empLegacy ? [empLegacy] : undefined;

    const { salaryMin, salaryMax } = resolveSalaryBoundsFromDraft(draft);

    const workplaceTypes = normalizeHiringSignalTokenList(draft.workplaceTypes);
    const industries = normalizeHiringSignalTokenList(draft.industries);
    const excludedIndustries = normalizeHiringSignalTokenList(
      draft.excludedIndustries,
    );
    const excludedTitlesFull = normalizeHiringSignalTokenList(
      draft.excludedTitles,
    );
    const excludedCompaniesFull = normalizeHiringSignalTokenList(
      draft.excludedCompanies,
    );
    const excludedLocationsFull = normalizeHiringSignalTokenList(
      draft.excludedLocations,
    );
    const experienceBuckets = normalizeHiringSignalTokenList(
      draft.experienceBuckets,
    );
    const roleTracks = normalizeHiringSignalTokenList(draft.roleTracks);
    const educationLevelMins = normalizeHiringSignalTokenList(
      draft.educationLevelMins,
    );
    const skillsAll = normalizeHiringSignalTokenList(draft.skillsAll);

    const countries = normalizeHiringSignalTokenList(draft.countries);

    const clearanceRaw = draft.clearanceMode.trim().toLowerCase();
    const clearanceMode: undefined | "" | "allow" | "hide" | "only" =
      clearanceRaw === "hide" || clearanceRaw === "only"
        ? clearanceRaw
        : undefined;

    setFilters((f) => ({
      ...f,
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
      excludedTitles: excludedTitlesFull.length
        ? excludedTitlesFull
        : undefined,
      excludedCompanies: excludedCompaniesFull.length
        ? excludedCompaniesFull
        : undefined,
      excludedLocations: excludedLocationsFull.length
        ? excludedLocationsFull
        : undefined,
      salaryMin,
      salaryMax,
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
      countries: countries.length ? countries : undefined,
      applyMethod: draft.applyMethod.trim() || undefined,
      seniority:
        draft.seniorityCustom.trim() ||
        draft.seniorityPreset.trim() ||
        undefined,
      functionCategory:
        draft.functionCustom.trim() || draft.functionPreset.trim() || undefined,
      postedAfter: draft.postedAfter.trim() || undefined,
      postedBefore: draft.postedBefore.trim() || undefined,
      offset: 0,
    }));
  }, [draft, setFilters]);

  const applyFiltersRef = useRef(applyFilters);
  applyFiltersRef.current = applyFilters;

  const skipInitialAutoApplyRef = useRef(true);
  /**
   * React 18 Strict Mode (dev) re-runs effects once with the same state. After we skip the
   * first empty-draft mount, that second run would otherwise schedule a debounced `applyFilters`
   * that clears `JobListFilters` and refetches unfiltered rows.
   */
  const suppressOneEmptyDebouncedApplyRef = useRef(false);

  /** Debounce so rapid control changes and combobox token updates do not refetch on every tick. */
  useEffect(() => {
    if (effectiveHireSignalDraftFieldCount(draft) > 0) {
      suppressOneEmptyDebouncedApplyRef.current = false;
    }
    if (skipInitialAutoApplyRef.current) {
      skipInitialAutoApplyRef.current = false;
      suppressOneEmptyDebouncedApplyRef.current = true;
      return;
    }
    if (
      suppressOneEmptyDebouncedApplyRef.current &&
      effectiveHireSignalDraftFieldCount(draft) === 0
    ) {
      suppressOneEmptyDebouncedApplyRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      applyFiltersRef.current();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft]);

  const onCompanyFacetChange = useCallback((key: string, values: string[]) => {
    setDraft((d) => ({
      ...d,
      companyFacetValues: { ...d.companyFacetValues, [key]: values },
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setDraft(EMPTY_HIRING_SIGNAL_DRAFT);
    setFilters((f) => ({
      ...f,
      titles: undefined,
      companies: undefined,
      locations: undefined,
      employmentType: undefined,
      employmentTypes: undefined,
      seniority: undefined,
      functionCategory: undefined,
      postedAfter: undefined,
      postedBefore: undefined,
      runId: undefined,
      workplaceTypes: undefined,
      industries: undefined,
      excludedIndustries: undefined,
      excludedTitles: undefined,
      excludedCompanies: undefined,
      excludedLocations: undefined,
      salaryMin: undefined,
      salaryMax: undefined,
      experienceBuckets: undefined,
      roleTracks: undefined,
      educationLevelMins: undefined,
      clearanceMode: undefined,
      h1bOnly: undefined,
      skillsAll: undefined,
      hideApplied: false,
      countries: undefined,
      applyMethod: undefined,
      companyUuids: undefined,
      excludedCompanyUuids: undefined,
      sortKey: DEFAULT_JOB_SORT_KEY,
      sortOrder: DEFAULT_JOB_SORT_ORDER,
      offset: 0,
    }));
  }, [setFilters]);

  const onDraftField = useCallback(
    (
      field: HiringSignalDraftField,
      value: string | string[] | boolean | Record<string, string[]>,
    ) => {
      setDraft((d) => {
        if (
          field === "companyFacetValues" &&
          value &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          return {
            ...d,
            companyFacetValues: value as Record<string, string[]>,
          };
        }
        if (field === "h1bOnly" && typeof value === "boolean") {
          return { ...d, h1bOnly: value };
        }
        if (TOKEN_ARRAY_FIELDS.has(field)) {
          const arr = Array.isArray(value) ? value : [String(value)];
          return {
            ...d,
            [field]: normalizeHiringSignalTokenList(arr.map((x) => String(x))),
          };
        }
        return { ...d, [field]: value as string };
      });
    },
    [],
  );

  const mergeResumeSuggestions = useCallback(
    (titles: string[], locations: string[], ext: Record<string, unknown>) => {
      setDraft((d) => {
        const mergeArr = (a: string[], b: string[]) =>
          normalizeHiringSignalTokenList([...a, ...b]);
        const next: HiringSignalFilterDraft = {
          ...d,
          titles: mergeArr(d.titles, titles).slice(0, 25),
          locations: mergeArr(d.locations, locations).slice(0, 20),
        };
        if (Array.isArray(ext.skillsAll)) {
          next.skillsAll = mergeArr(
            d.skillsAll,
            ext.skillsAll.map((x) => String(x)),
          ).slice(0, 25);
        }
        if (Array.isArray(ext.educationLevelMins)) {
          const fromResume = ext.educationLevelMins.map((x) =>
            String(x).trim().toLowerCase(),
          );
          next.educationLevelMins = [
            ...new Set([
              ...normalizeHiringSignalTokenList(d.educationLevelMins),
              ...fromResume.filter(Boolean),
            ]),
          ];
        }
        return next;
      });
    },
    [],
  );

  const activeDraftCount = useMemo(
    () => effectiveHireSignalDraftFieldCount(draft),
    [draft],
  );

  const value = useMemo(
    (): HireSignalFilterContextValue => ({
      draft,
      setDraft,
      onDraftField,
      applyFilters,
      resetFilters,
      mergeResumeSuggestions,
      activeDraftCount,
      onCompanyFacetChange,
      draftRef,
    }),
    [
      draft,
      setDraft,
      onDraftField,
      applyFilters,
      resetFilters,
      mergeResumeSuggestions,
      activeDraftCount,
      onCompanyFacetChange,
      draftRef,
    ],
  );

  return (
    <HireSignalFilterContext.Provider value={value}>
      {children}
    </HireSignalFilterContext.Provider>
  );
}

export function useHireSignalFilter(): HireSignalFilterContextValue {
  const c = useContext(HireSignalFilterContext);
  if (!c) {
    throw new Error("useHireSignalFilter requires HireSignalFilterProvider");
  }
  return c;
}

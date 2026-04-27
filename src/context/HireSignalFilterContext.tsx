"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";
import {
  EMPTY_HIRING_SIGNAL_DRAFT,
  normalizeHiringSignalTokenList,
  type HiringSignalFilterDraft,
  type HiringSignalDraftField,
} from "@/components/feature/hiring-signals/hiringSignalFilterDraft";

/** Count of non-empty draft fields (toolbar / filter badge). */
export function countFilledDraftFields(d: HiringSignalFilterDraft): number {
  let n = 0;
  (Object.keys(d) as HiringSignalDraftField[]).forEach((k) => {
    const v = d[k];
    if (Array.isArray(v)) {
      if (normalizeHiringSignalTokenList(v).length > 0) n += 1;
    } else if (String(v).trim()) n += 1;
  });
  return n;
}

export interface HireSignalFilterContextValue {
  draft: HiringSignalFilterDraft;
  setDraft: React.Dispatch<React.SetStateAction<HiringSignalFilterDraft>>;
  onDraftField: (
    field: HiringSignalDraftField,
    value: string | string[],
  ) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  activeDraftCount: number;
}

const HireSignalFilterContext =
  createContext<HireSignalFilterContextValue | null>(null);

export function HireSignalFilterProvider({
  children,
  setFilters,
}: {
  children: ReactNode;
  setFilters: React.Dispatch<React.SetStateAction<JobListFilters>>;
}) {
  const [draft, setDraft] = useState<HiringSignalFilterDraft>(
    EMPTY_HIRING_SIGNAL_DRAFT,
  );

  const applyFilters = useCallback(() => {
    const titles = normalizeHiringSignalTokenList(draft.titles);
    const companies = normalizeHiringSignalTokenList(draft.companies);
    const locations = normalizeHiringSignalTokenList(draft.locations);
    setFilters((f) => ({
      ...f,
      titles: titles.length ? titles : undefined,
      companies: companies.length ? companies : undefined,
      locations: locations.length ? locations : undefined,
      employmentType: draft.employmentType.trim() || undefined,
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

  const resetFilters = useCallback(() => {
    setDraft(EMPTY_HIRING_SIGNAL_DRAFT);
    setFilters((f) => ({
      ...f,
      titles: undefined,
      companies: undefined,
      locations: undefined,
      employmentType: undefined,
      seniority: undefined,
      functionCategory: undefined,
      postedAfter: undefined,
      postedBefore: undefined,
      runId: undefined,
      offset: 0,
    }));
  }, [setFilters]);

  const onDraftField = useCallback(
    (field: HiringSignalDraftField, value: string | string[]) => {
      setDraft((d) => {
        if (
          field === "titles" ||
          field === "companies" ||
          field === "locations"
        ) {
          const arr = Array.isArray(value) ? value : [value];
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

  const activeDraftCount = useMemo(
    () => countFilledDraftFields(draft),
    [draft],
  );

  const value = useMemo(
    (): HireSignalFilterContextValue => ({
      draft,
      setDraft,
      onDraftField,
      applyFilters,
      resetFilters,
      activeDraftCount,
    }),
    [draft, onDraftField, applyFilters, resetFilters, activeDraftCount],
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

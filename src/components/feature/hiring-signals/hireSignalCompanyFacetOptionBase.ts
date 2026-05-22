import {
  normalizeHiringSignalTokenList,
  resolveSalaryBoundsFromDraft,
  type HiringSignalFilterDraft,
} from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import { effectivePostedAfter } from "@/hooks/useHiringSignals";
import {
  hireSignalFirmographicListFiltersFromDraft,
  omitFirmographicDimensionFromJobListFilters,
  type HireSignalFirmographicFacetDimension,
  type JobListFilters,
} from "@/services/graphql/hiringSignalService";

/** Scope for company cohort facet option queries (exclude resolved UUID lists). */
export function buildHireSignalCompanyFacetOptionBase(
  applied: JobListFilters,
  draft: HiringSignalFilterDraft,
  preset: "all" | "new_7d",
  options?: {
    /** Omit this dimension from base so bucket counts are not all zero except the selection. */
    excludeSelfFirmographicDimension?: HireSignalFirmographicFacetDimension;
  },
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

  let scopedApplied = applied;
  if (options?.excludeSelfFirmographicDimension) {
    scopedApplied = omitFirmographicDimensionFromJobListFilters(
      applied,
      options.excludeSelfFirmographicDimension,
    );
  }

  let result: JobListFilters = {
    ...scopedApplied,
    companyUuids: undefined,
    excludedCompanyUuids: undefined,
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
    postedAfter: effectivePostedAfter(
      preset,
      draftPosted || applied.postedAfter,
    ),
    postedBefore:
      draft.postedBefore.trim() || applied.postedBefore || undefined,
    ...hireSignalFirmographicListFiltersFromDraft(draft),
  };
  if (options?.excludeSelfFirmographicDimension) {
    result = omitFirmographicDimensionFromJobListFilters(
      result,
      options.excludeSelfFirmographicDimension,
    );
  }
  return result;
}

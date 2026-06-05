import {
  normalizeHiringSignalTokenList,
  resolveSalaryBoundsFromDraft,
  type HiringSignalFilterDraft,
} from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import { effectivePostedBounds } from "@/hooks/useHiringSignals";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";

/** Build job list filter scope for facet option counts (draft + applied, offset 0). */
export function buildHireSignalFacetOptionBase(
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
  const countries = normalizeHiringSignalTokenList(draft.countries);
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
    countries: countries.length ? countries : undefined,
    clearanceMode: clearanceMode || undefined,
    h1bOnly: draft.h1bOnly ? true : undefined,
    applyMethod: draft.applyMethod.trim() || undefined,
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

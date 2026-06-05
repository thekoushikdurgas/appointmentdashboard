"use client";

import { HiringSignalCompanyNameFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalCompanyNameFacetCombobox";
import { HiringSignalCompanyCountryFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalCompanyCountryFacetCombobox";
import { HiringSignalCompanyBucketFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalCompanyBucketFacetCombobox";
import { HiringSignalCompanyIndustryFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalCompanyIndustryFacetCombobox";
import { HsFilterSection } from "@/components/feature/hiring-signals/HsFilterSection";
import { HS_FILTER_SECTION_IDS } from "@/components/feature/hiring-signals/hsFilterSectionIds";
import {
  HS_COMPANY_FILTER_CHIP_PREFIXES,
  HsFilterChipList,
  pickHsFilterChipsByKeyPrefix,
  type HsFilterChipItem,
} from "@/components/feature/hiring-signals/hsFilterChips";
import { HiringSignalFilterComingSoon } from "@/components/feature/hiring-signals/HiringSignalFilterComingSoon";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import { useRole } from "@/context/RoleContext";
import { isCompanyCohortActive } from "@/lib/hireSignalCompanyCohort";
import { normalizeHiringSignalTokenList } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";

export interface HiringSignalsCompanyFiltersProps {
  appliedListFilters: JobListFilters;
  signalTimePreset: "all" | "new_7d";
  companyCohortResolving?: boolean;
  companyCohortMatchTotal?: number | null;
  companyCohortTruncated?: boolean;
  /** Active company cohort chips (rendered inside each filter section). */
  companyFilterChips?: HsFilterChipItem[];
}

export function HiringSignalsCompanyFilters({
  appliedListFilters,
  signalTimePreset,
  companyCohortResolving = false,
  companyCohortMatchTotal = null,
  companyCohortTruncated = false,
  companyFilterChips = [],
}: HiringSignalsCompanyFiltersProps) {
  const { draft, onDraftField } = useHireSignalFilter();
  const { isAdmin, isSuperAdmin } = useRole();
  const canUseAdvancedCompanyCohortFilters = isAdmin || isSuperAdmin;
  const cohortActive = isCompanyCohortActive(draft);

  return (
    <>
      <h3 className="c360-hs-filters__group-header">Company filters</h3>
      {companyCohortResolving ? (
        <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
          Resolving companies…
        </p>
      ) : null}
      {!companyCohortResolving &&
      cohortActive &&
      companyCohortMatchTotal != null ? (
        <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
          {companyCohortMatchTotal.toLocaleString()} companies match
          {companyCohortTruncated
            ? " (UUID list capped — narrow filters for full coverage)"
            : ""}
        </p>
      ) : null}

      <HsFilterSection
        sectionId={HS_FILTER_SECTION_IDS.companyName}
        title="Company name"
        count={
          normalizeHiringSignalTokenList(draft.companyNames).length +
          normalizeHiringSignalTokenList(draft.excludedCompanyNames).length
        }
        onClear={
          draft.companyNames.length > 0 || draft.excludedCompanyNames.length > 0
            ? () => {
                onDraftField("companyNames", []);
                onDraftField("excludedCompanyNames", []);
              }
            : undefined
        }
      >
        <div className="c360-space-y-3">
          <HsFilterChipList
            items={pickHsFilterChipsByKeyPrefix(
              companyFilterChips,
              HS_COMPANY_FILTER_CHIP_PREFIXES.name,
            )}
            variant="section"
          />
          <HiringSignalCompanyNameFacetCombobox
            appliedListFilters={appliedListFilters}
            signalTimePreset={signalTimePreset}
            label="Include company names"
            selectedValues={normalizeHiringSignalTokenList(draft.companyNames)}
            onSelectionChange={(v) => onDraftField("companyNames", v)}
          />
          <HiringSignalCompanyNameFacetCombobox
            appliedListFilters={appliedListFilters}
            signalTimePreset={signalTimePreset}
            label="Exclude company names"
            selectedValues={normalizeHiringSignalTokenList(
              draft.excludedCompanyNames,
            )}
            onSelectionChange={(v) => onDraftField("excludedCompanyNames", v)}
          />
        </div>
      </HsFilterSection>

      <HsFilterSection
        sectionId={HS_FILTER_SECTION_IDS.companyCountry}
        title="Country"
        count={
          normalizeHiringSignalTokenList(draft.companyCountries).length +
          normalizeHiringSignalTokenList(draft.excludedCompanyCountries).length
        }
        onClear={
          draft.companyCountries.length > 0 ||
          draft.excludedCompanyCountries.length > 0
            ? () => {
                onDraftField("companyCountries", []);
                onDraftField("excludedCompanyCountries", []);
              }
            : undefined
        }
      >
        <div className="c360-space-y-3">
          <HsFilterChipList
            items={pickHsFilterChipsByKeyPrefix(
              companyFilterChips,
              HS_COMPANY_FILTER_CHIP_PREFIXES.country,
            )}
            variant="section"
          />
          <HiringSignalCompanyCountryFacetCombobox
            appliedListFilters={appliedListFilters}
            signalTimePreset={signalTimePreset}
            label="Include country"
            selectedValues={normalizeHiringSignalTokenList(
              draft.companyCountries,
            )}
            onSelectionChange={(v) => onDraftField("companyCountries", v)}
          />
          <HiringSignalCompanyCountryFacetCombobox
            appliedListFilters={appliedListFilters}
            signalTimePreset={signalTimePreset}
            label="Exclude country"
            selectedValues={normalizeHiringSignalTokenList(
              draft.excludedCompanyCountries,
            )}
            onSelectionChange={(v) =>
              onDraftField("excludedCompanyCountries", v)
            }
          />
        </div>
      </HsFilterSection>

      <HsFilterSection
        sectionId={HS_FILTER_SECTION_IDS.companyIndustry}
        title="Industry"
        count={
          normalizeHiringSignalTokenList(draft.companyIndustries).length +
          normalizeHiringSignalTokenList(draft.excludedCompanyIndustries).length
        }
        onClear={
          draft.companyIndustries.length > 0 ||
          draft.excludedCompanyIndustries.length > 0
            ? () => {
                onDraftField("companyIndustries", []);
                onDraftField("excludedCompanyIndustries", []);
              }
            : undefined
        }
      >
        <div className="c360-space-y-3">
          <HsFilterChipList
            items={pickHsFilterChipsByKeyPrefix(
              companyFilterChips,
              HS_COMPANY_FILTER_CHIP_PREFIXES.industry,
            )}
            variant="section"
          />
          {canUseAdvancedCompanyCohortFilters ? (
            <>
              <HiringSignalCompanyIndustryFacetCombobox
                appliedListFilters={appliedListFilters}
                signalTimePreset={signalTimePreset}
                label="Include industry"
                selectedValues={normalizeHiringSignalTokenList(
                  draft.companyIndustries,
                )}
                onSelectionChange={(v) => onDraftField("companyIndustries", v)}
              />
              <HiringSignalCompanyIndustryFacetCombobox
                appliedListFilters={appliedListFilters}
                signalTimePreset={signalTimePreset}
                label="Exclude industry"
                selectedValues={normalizeHiringSignalTokenList(
                  draft.excludedCompanyIndustries,
                )}
                onSelectionChange={(v) =>
                  onDraftField("excludedCompanyIndustries", v)
                }
              />
            </>
          ) : (
            <HiringSignalFilterComingSoon featureLabel="Industry" />
          )}
        </div>
      </HsFilterSection>

      <HsFilterSection
        sectionId={HS_FILTER_SECTION_IDS.companyEmployeeSize}
        title="Employee size"
        count={
          normalizeHiringSignalTokenList(draft.companyEmployeeSizes).length +
          normalizeHiringSignalTokenList(draft.excludedCompanyEmployeeSizes)
            .length
        }
        onClear={
          draft.companyEmployeeSizes.length > 0 ||
          draft.excludedCompanyEmployeeSizes.length > 0
            ? () => {
                onDraftField("companyEmployeeSizes", []);
                onDraftField("excludedCompanyEmployeeSizes", []);
              }
            : undefined
        }
      >
        <div className="c360-space-y-3">
          <HsFilterChipList
            items={pickHsFilterChipsByKeyPrefix(
              companyFilterChips,
              HS_COMPANY_FILTER_CHIP_PREFIXES.employeeSize,
            )}
            variant="section"
          />
          {canUseAdvancedCompanyCohortFilters ? (
            <>
              <HiringSignalCompanyBucketFacetCombobox
                dimension="employeeSize"
                appliedListFilters={appliedListFilters}
                signalTimePreset={signalTimePreset}
                label="Include employee size"
                selectedValues={normalizeHiringSignalTokenList(
                  draft.companyEmployeeSizes,
                )}
                onSelectionChange={(v) =>
                  onDraftField("companyEmployeeSizes", v)
                }
              />
              <HiringSignalCompanyBucketFacetCombobox
                dimension="employeeSize"
                appliedListFilters={appliedListFilters}
                signalTimePreset={signalTimePreset}
                label="Exclude employee size"
                selectedValues={normalizeHiringSignalTokenList(
                  draft.excludedCompanyEmployeeSizes,
                )}
                onSelectionChange={(v) =>
                  onDraftField("excludedCompanyEmployeeSizes", v)
                }
              />
            </>
          ) : (
            <HiringSignalFilterComingSoon featureLabel="Employee size" />
          )}
        </div>
      </HsFilterSection>

      <HsFilterSection
        sectionId={HS_FILTER_SECTION_IDS.companyRevenue}
        title="Revenue"
        count={
          normalizeHiringSignalTokenList(draft.companyRevenue).length +
          normalizeHiringSignalTokenList(draft.excludedCompanyRevenue).length
        }
        onClear={
          draft.companyRevenue.length > 0 ||
          draft.excludedCompanyRevenue.length > 0
            ? () => {
                onDraftField("companyRevenue", []);
                onDraftField("excludedCompanyRevenue", []);
              }
            : undefined
        }
      >
        <div className="c360-space-y-3">
          <HsFilterChipList
            items={pickHsFilterChipsByKeyPrefix(
              companyFilterChips,
              HS_COMPANY_FILTER_CHIP_PREFIXES.revenue,
            )}
            variant="section"
          />
          {canUseAdvancedCompanyCohortFilters ? (
            <>
              <HiringSignalCompanyBucketFacetCombobox
                dimension="revenue"
                appliedListFilters={appliedListFilters}
                signalTimePreset={signalTimePreset}
                label="Include revenue"
                selectedValues={normalizeHiringSignalTokenList(
                  draft.companyRevenue,
                )}
                onSelectionChange={(v) => onDraftField("companyRevenue", v)}
              />
              <HiringSignalCompanyBucketFacetCombobox
                dimension="revenue"
                appliedListFilters={appliedListFilters}
                signalTimePreset={signalTimePreset}
                label="Exclude revenue"
                selectedValues={normalizeHiringSignalTokenList(
                  draft.excludedCompanyRevenue,
                )}
                onSelectionChange={(v) =>
                  onDraftField("excludedCompanyRevenue", v)
                }
              />
            </>
          ) : (
            <HiringSignalFilterComingSoon featureLabel="Revenue" />
          )}
        </div>
      </HsFilterSection>

      <HsFilterSection
        sectionId={HS_FILTER_SECTION_IDS.companyFunding}
        title="Funding"
        count={
          normalizeHiringSignalTokenList(draft.companyFunding).length +
          normalizeHiringSignalTokenList(draft.excludedCompanyFunding).length
        }
        onClear={
          draft.companyFunding.length > 0 ||
          draft.excludedCompanyFunding.length > 0
            ? () => {
                onDraftField("companyFunding", []);
                onDraftField("excludedCompanyFunding", []);
              }
            : undefined
        }
      >
        <div className="c360-space-y-3">
          <HsFilterChipList
            items={pickHsFilterChipsByKeyPrefix(
              companyFilterChips,
              HS_COMPANY_FILTER_CHIP_PREFIXES.funding,
            )}
            variant="section"
          />
          {canUseAdvancedCompanyCohortFilters ? (
            <>
              <HiringSignalCompanyBucketFacetCombobox
                dimension="funding"
                appliedListFilters={appliedListFilters}
                signalTimePreset={signalTimePreset}
                label="Include funding"
                selectedValues={normalizeHiringSignalTokenList(
                  draft.companyFunding,
                )}
                onSelectionChange={(v) => onDraftField("companyFunding", v)}
              />
              <HiringSignalCompanyBucketFacetCombobox
                dimension="funding"
                appliedListFilters={appliedListFilters}
                signalTimePreset={signalTimePreset}
                label="Exclude funding"
                selectedValues={normalizeHiringSignalTokenList(
                  draft.excludedCompanyFunding,
                )}
                onSelectionChange={(v) =>
                  onDraftField("excludedCompanyFunding", v)
                }
              />
            </>
          ) : (
            <HiringSignalFilterComingSoon featureLabel="Funding" />
          )}
        </div>
      </HsFilterSection>
    </>
  );
}

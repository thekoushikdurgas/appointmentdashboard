"use client";

import { HiringSignalCompanyNameFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalCompanyNameFacetCombobox";
import { HiringSignalCompanyCountryFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalCompanyCountryFacetCombobox";
import { HiringSignalCompanyFundingFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalCompanyFundingFacetCombobox";
import { HiringSignalCompanyEmployeeSizeFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalCompanyEmployeeSizeFacetCombobox";
import { HiringSignalCompanyIndustryFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalCompanyIndustryFacetCombobox";
import { HiringSignalCompanyRevenueFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalCompanyRevenueFacetCombobox";
import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import { isCompanyCohortActive } from "@/lib/hireSignalCompanyCohort";
import { normalizeHiringSignalTokenList } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";

export interface HiringSignalsCompanyFiltersProps {
  appliedListFilters: JobListFilters;
  signalTimePreset: "all" | "new_7d";
  companyCohortResolving?: boolean;
  companyCohortMatchTotal?: number | null;
  companyCohortTruncated?: boolean;
}

export function HiringSignalsCompanyFilters({
  appliedListFilters,
  signalTimePreset,
  companyCohortResolving = false,
  companyCohortMatchTotal = null,
  companyCohortTruncated = false,
}: HiringSignalsCompanyFiltersProps) {
  const { draft, onDraftField } = useHireSignalFilter();
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

      <ContactsCollapsibleFilterSection
        title="Company name"
        count={
          normalizeHiringSignalTokenList(draft.companyNames).length +
          normalizeHiringSignalTokenList(draft.excludedCompanyNames).length
        }
        defaultOpen
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
      </ContactsCollapsibleFilterSection>

      <ContactsCollapsibleFilterSection
        title="Country"
        count={
          normalizeHiringSignalTokenList(draft.companyCountries).length +
          normalizeHiringSignalTokenList(draft.excludedCompanyCountries).length
        }
        defaultOpen
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
      </ContactsCollapsibleFilterSection>

      <ContactsCollapsibleFilterSection
        title="Industry"
        count={
          normalizeHiringSignalTokenList(draft.companyIndustries).length +
          normalizeHiringSignalTokenList(draft.excludedCompanyIndustries).length
        }
        defaultOpen
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
        </div>
      </ContactsCollapsibleFilterSection>

      <ContactsCollapsibleFilterSection
        title="Employee size"
        count={
          normalizeHiringSignalTokenList(draft.companyEmployeeSizes).length +
          normalizeHiringSignalTokenList(draft.excludedCompanyEmployeeSizes)
            .length
        }
        defaultOpen
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
          <HiringSignalCompanyEmployeeSizeFacetCombobox
            appliedListFilters={appliedListFilters}
            signalTimePreset={signalTimePreset}
            label="Include employee size"
            selectedValues={normalizeHiringSignalTokenList(
              draft.companyEmployeeSizes,
            )}
            onSelectionChange={(v) => onDraftField("companyEmployeeSizes", v)}
          />
          <HiringSignalCompanyEmployeeSizeFacetCombobox
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
        </div>
      </ContactsCollapsibleFilterSection>

      <ContactsCollapsibleFilterSection
        title="Revenue"
        count={
          normalizeHiringSignalTokenList(draft.companyRevenue).length +
          normalizeHiringSignalTokenList(draft.excludedCompanyRevenue).length
        }
        defaultOpen
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
          <HiringSignalCompanyRevenueFacetCombobox
            appliedListFilters={appliedListFilters}
            signalTimePreset={signalTimePreset}
            label="Include revenue"
            selectedValues={normalizeHiringSignalTokenList(draft.companyRevenue)}
            onSelectionChange={(v) => onDraftField("companyRevenue", v)}
          />
          <HiringSignalCompanyRevenueFacetCombobox
            appliedListFilters={appliedListFilters}
            signalTimePreset={signalTimePreset}
            label="Exclude revenue"
            selectedValues={normalizeHiringSignalTokenList(
              draft.excludedCompanyRevenue,
            )}
            onSelectionChange={(v) => onDraftField("excludedCompanyRevenue", v)}
          />
        </div>
      </ContactsCollapsibleFilterSection>

      <ContactsCollapsibleFilterSection
        title="Funding"
        count={
          normalizeHiringSignalTokenList(draft.companyFunding).length +
          normalizeHiringSignalTokenList(draft.excludedCompanyFunding).length
        }
        defaultOpen
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
          <HiringSignalCompanyFundingFacetCombobox
            appliedListFilters={appliedListFilters}
            signalTimePreset={signalTimePreset}
            label="Include funding"
            selectedValues={normalizeHiringSignalTokenList(
              draft.companyFunding,
            )}
            onSelectionChange={(v) => onDraftField("companyFunding", v)}
          />
          <HiringSignalCompanyFundingFacetCombobox
            appliedListFilters={appliedListFilters}
            signalTimePreset={signalTimePreset}
            label="Exclude funding"
            selectedValues={normalizeHiringSignalTokenList(
              draft.excludedCompanyFunding,
            )}
            onSelectionChange={(v) => onDraftField("excludedCompanyFunding", v)}
          />
        </div>
      </ContactsCollapsibleFilterSection>
    </>
  );
}

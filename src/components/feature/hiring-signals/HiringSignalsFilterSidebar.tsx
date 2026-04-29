"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import { normalizeHiringSignalTokenList } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import { HiringSignalTextFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalTextFacetCombobox";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";

const EMPLOYMENT_OPTIONS = [
  { value: "", label: "Any" },
  { value: "Full-time", label: "Full-time" },
  { value: "Contract", label: "Contract" },
  { value: "Part-time", label: "Part-time" },
  { value: "Remote", label: "Remote" },
];

const EMPLOYMENT_MULTI_OPTIONS = EMPLOYMENT_OPTIONS.filter((o) => o.value);

const WORKPLACE_OPTIONS = [
  { value: "Remote", label: "Remote" },
  { value: "Hybrid", label: "Hybrid" },
  { value: "On-site", label: "On-site" },
];

const EXPERIENCE_BUCKET_OPTIONS = [
  { value: "intern", label: "Intern / new grad" },
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead_staff", label: "Lead / staff / principal" },
  { value: "director_exec", label: "Director / exec" },
];

const ROLE_TRACK_OPTIONS = [
  { value: "ic", label: "Individual contributor" },
  { value: "manager", label: "Manager / leadership title" },
];

const EDUCATION_MIN_OPTIONS = [
  { value: "certificate", label: "Certificate" },
  { value: "associate", label: "Associate" },
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "mba", label: "MBA" },
  { value: "phd", label: "PhD" },
];

const CLEARANCE_OPTIONS = [
  { value: "", label: "No clearance filter" },
  { value: "hide", label: "Hide clearance-required" },
  { value: "only", label: "Only clearance-required" },
];

const SENIORITY_PRESET_OPTIONS = [
  { value: "", label: "Any" },
  { value: "Entry level", label: "Entry level" },
  { value: "Mid-Senior", label: "Mid-Senior" },
  { value: "Senior", label: "Senior" },
  { value: "Director", label: "Director" },
  { value: "VP", label: "VP" },
  { value: "C-Suite", label: "C-Suite" },
];

const FUNCTION_PRESET_OPTIONS = [
  { value: "", label: "Any" },
  { value: "Engineering", label: "Engineering" },
  { value: "Sales", label: "Sales" },
  { value: "Marketing", label: "Marketing" },
  { value: "Operations", label: "Operations" },
  { value: "Finance", label: "Finance" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Product", label: "Product" },
  { value: "Design", label: "Design" },
  { value: "Legal", label: "Legal" },
  { value: "Consulting", label: "Consulting" },
  { value: "Other", label: "Other" },
];

const TEXTAREA_CLASS =
  "c360-min-h-[72px] c360-w-full c360-rounded c360-border c360-border-ink-8 c360-bg-ink-1 c360-p-2 c360-text-2xs";

function tokensFromLines(raw: string): string[] {
  return normalizeHiringSignalTokenList(raw.split(/[\n,]+/));
}

function toggleInList(list: string[], token: string): string[] {
  const t = token.trim();
  if (!t) return list;
  return list.includes(t) ? list.filter((x) => x !== t) : [...list, t];
}

export type {
  HiringSignalFilterDraft,
  HiringSignalDraftField,
} from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
export { EMPTY_HIRING_SIGNAL_DRAFT } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";

export interface HiringSignalsFilterSidebarProps {
  onApply: () => void;
  /** Applied list filters (API state) — used to scope facet option queries. */
  appliedListFilters: JobListFilters;
  signalTimePreset: "all" | "new_7d";
  /** Active Apify run filter (from Runs tab drill-down). */
  appliedRunId?: string;
  onClearRunId?: () => void;
  className?: string;
}

export function HiringSignalsFilterSidebar({
  onApply,
  appliedListFilters,
  signalTimePreset,
  appliedRunId,
  onClearRunId,
  className,
}: HiringSignalsFilterSidebarProps) {
  const { draft, onDraftField, resetFilters } = useHireSignalFilter();

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  const addChip = (key: string, label: string, clear: () => void) => {
    chips.push({ key, label, onRemove: clear });
  };

  const addTokenChips = (
    prefix: string,
    values: string[],
    labelPrefix: string,
    field:
      | "titles"
      | "companies"
      | "locations"
      | "employmentTypes"
      | "workplaceTypes"
      | "industries"
      | "excludedIndustries"
      | "excludedTitles"
      | "excludedCompanies"
      | "excludedLocations"
      | "experienceBuckets"
      | "roleTracks"
      | "educationLevelMins"
      | "skillsAll",
  ) => {
    values.forEach((raw, i) => {
      const t = raw.trim();
      if (!t) return;
      addChip(`${prefix}-${i}-${t}`, `${labelPrefix}: ${t}`, () => {
        onDraftField(
          field,
          values.filter((_, j) => j !== i),
        );
      });
    });
  };

  addTokenChips("title", draft.titles, "Title", "titles");
  addTokenChips("co", draft.companies, "Company", "companies");
  addTokenChips("loc", draft.locations, "Location", "locations");
  addTokenChips("emp", draft.employmentTypes, "Employment", "employmentTypes");
  if (draft.employmentType.trim())
    addChip("emp-legacy", `Employment (legacy): ${draft.employmentType}`, () =>
      onDraftField("employmentType", ""),
    );
  addTokenChips("wp", draft.workplaceTypes, "Workplace", "workplaceTypes");
  addTokenChips("ind", draft.industries, "Industry", "industries");
  addTokenChips("exind", draft.excludedIndustries, "Excl. industry", "excludedIndustries");
  addTokenChips("exti", draft.excludedTitles, "Excl. title", "excludedTitles");
  addTokenChips("exco", draft.excludedCompanies, "Excl. company", "excludedCompanies");
  addTokenChips("exloc", draft.excludedLocations, "Excl. location", "excludedLocations");
  addTokenChips("xb", draft.experienceBuckets, "Experience", "experienceBuckets");
  addTokenChips("rt", draft.roleTracks, "Role track", "roleTracks");
  addTokenChips("edu", draft.educationLevelMins, "Education ≥", "educationLevelMins");
  addTokenChips("sk", draft.skillsAll, "Skill", "skillsAll");

  if (draft.salaryMin.trim())
    addChip("salary", `Min salary: $${draft.salaryMin.trim()}`, () =>
      onDraftField("salaryMin", ""),
    );

  if (draft.clearanceMode.trim() === "hide")
    addChip("clr", "Clearance: hide required", () =>
      onDraftField("clearanceMode", ""),
    );
  if (draft.clearanceMode.trim() === "only")
    addChip("clo", "Clearance: only required", () =>
      onDraftField("clearanceMode", ""),
    );

  if (draft.h1bOnly)
    addChip("h1b", "H1B / sponsorship mention", () =>
      onDraftField("h1bOnly", false),
    );

  if (draft.seniorityPreset.trim() || draft.seniorityCustom.trim()) {
    const s =
      draft.seniorityCustom.trim() || draft.seniorityPreset.trim() || "";
    addChip("seniority", `Seniority: ${s}`, () => {
      onDraftField("seniorityPreset", "");
      onDraftField("seniorityCustom", "");
    });
  }
  if (draft.functionPreset.trim() || draft.functionCustom.trim()) {
    const s = draft.functionCustom.trim() || draft.functionPreset.trim() || "";
    addChip("func", `Function: ${s}`, () => {
      onDraftField("functionPreset", "");
      onDraftField("functionCustom", "");
    });
  }
  if (draft.postedAfter.trim())
    addChip("after", `After ${draft.postedAfter}`, () =>
      onDraftField("postedAfter", ""),
    );
  if (draft.postedBefore.trim())
    addChip("before", `Before ${draft.postedBefore}`, () =>
      onDraftField("postedBefore", ""),
    );

  const runChip =
    appliedRunId?.trim() && onClearRunId ? (
      <span key="run" className="c360-hs-filter-chip">
        <span className="c360-hs-filter-chip__text">
          Run: {appliedRunId.trim().slice(0, 12)}
          {appliedRunId.trim().length > 12 ? "…" : ""}
        </span>
        <button
          type="button"
          className="c360-hs-filter-chip__remove"
          aria-label="Clear run filter"
          onClick={onClearRunId}
        >
          <X size={12} />
        </button>
      </span>
    ) : null;

  const totalChips =
    chips.length + (appliedRunId?.trim() && onClearRunId ? 1 : 0);
  const titleValues = normalizeHiringSignalTokenList(draft.titles);
  const companyValues = normalizeHiringSignalTokenList(draft.companies);
  const locationValues = normalizeHiringSignalTokenList(draft.locations);
  const seniorityCount =
    draft.seniorityPreset.trim() || draft.seniorityCustom.trim() ? 1 : 0;
  const functionCount =
    draft.functionPreset.trim() || draft.functionCustom.trim() ? 1 : 0;

  const employmentCount =
    normalizeHiringSignalTokenList(draft.employmentTypes).length +
    (draft.employmentType.trim() ? 1 : 0);
  const workplaceCount = normalizeHiringSignalTokenList(draft.workplaceTypes)
    .length;
  const industriesCount = normalizeHiringSignalTokenList(draft.industries)
    .length;
  const exIndCount = normalizeHiringSignalTokenList(draft.excludedIndustries)
    .length;
  const exTitleCount = normalizeHiringSignalTokenList(draft.excludedTitles)
    .length;
  const exCoCount = normalizeHiringSignalTokenList(draft.excludedCompanies)
    .length;
  const exLocCount = normalizeHiringSignalTokenList(draft.excludedLocations)
    .length;
  const salaryCount = draft.salaryMin.trim() ? 1 : 0;
  const expBucketCount = normalizeHiringSignalTokenList(draft.experienceBuckets)
    .length;
  const roleTrackCount = normalizeHiringSignalTokenList(draft.roleTracks)
    .length;
  const eduCount = normalizeHiringSignalTokenList(draft.educationLevelMins)
    .length;
  const skillsCount = normalizeHiringSignalTokenList(draft.skillsAll).length;
  const clearanceCount =
    draft.clearanceMode.trim() === "hide" ||
    draft.clearanceMode.trim() === "only"
      ? 1
      : 0;
  const h1bCount = draft.h1bOnly ? 1 : 0;

  return (
    <div className={cn("c360-contacts-filters c360-hs-filters", className)}>
      <div className="c360-contacts-filters__head-row">
        <div className="c360-contacts-filters__head-text">
          <div className="c360-contacts-filters__head">
            <h2
              id="c360-filter-drawer-title"
              className="c360-contacts-filters__title"
            >
              Refine signals
            </h2>
          </div>
          <p className="c360-contacts-filters__subtitle">{totalChips} active</p>
        </div>
        <div className="c360-contacts-filters__head-actions">
          <Button type="button" variant="primary" size="sm" onClick={onApply}>
            Apply filters
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="c360-contacts-filters__clear-text"
            onClick={resetFilters}
          >
            Clear
          </Button>
        </div>
      </div>

      {totalChips > 0 ? (
        <div className="c360-mb-3">
          <p className="c360-mb-2 c360-text-2xs c360-font-medium c360-text-ink-muted">
            {totalChips} active filter{totalChips === 1 ? "" : "s"}
          </p>
          <div className="c360-hs-filter-chips">
            {runChip}
            {chips.map((c) => (
              <span key={c.key} className="c360-hs-filter-chip">
                <span className="c360-hs-filter-chip__text">{c.label}</span>
                <button
                  type="button"
                  className="c360-hs-filter-chip__remove"
                  aria-label={`Remove ${c.label}`}
                  onClick={c.onRemove}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="c360-hs-filters__sections">
        <ContactsCollapsibleFilterSection
          title="Title"
          count={titleValues.length}
          defaultOpen
          onClear={() => onDraftField("titles", [])}
        >
          <HiringSignalTextFacetCombobox
            field="title"
            label="Job title"
            draft={draft}
            appliedListFilters={appliedListFilters}
            signalTimePreset={signalTimePreset}
            selectedValues={titleValues}
            onSelectionChange={(v) => onDraftField("titles", v)}
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Company"
          count={companyValues.length}
          defaultOpen
          onClear={() => onDraftField("companies", [])}
        >
          <HiringSignalTextFacetCombobox
            field="company"
            label="Company"
            draft={draft}
            appliedListFilters={appliedListFilters}
            signalTimePreset={signalTimePreset}
            selectedValues={companyValues}
            onSelectionChange={(v) => onDraftField("companies", v)}
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Location"
          count={locationValues.length}
          defaultOpen
          onClear={() => onDraftField("locations", [])}
        >
          <HiringSignalTextFacetCombobox
            field="location"
            label="Location"
            draft={draft}
            appliedListFilters={appliedListFilters}
            signalTimePreset={signalTimePreset}
            selectedValues={locationValues}
            onSelectionChange={(v) => onDraftField("locations", v)}
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Basic job criteria"
          count={employmentCount + workplaceCount + seniorityCount + functionCount}
          defaultOpen={false}
          onClear={() => {
            onDraftField("employmentTypes", []);
            onDraftField("employmentType", "");
            onDraftField("workplaceTypes", []);
            onDraftField("seniorityPreset", "");
            onDraftField("seniorityCustom", "");
            onDraftField("functionPreset", "");
            onDraftField("functionCustom", "");
          }}
        >
          <p className="c360-mb-2 c360-text-2xs c360-font-medium c360-text-ink-muted">
            Employment type
          </p>
          <div className="c360-mb-3 c360-flex c360-flex-wrap c360-gap-2">
            {EMPLOYMENT_MULTI_OPTIONS.map((o) => (
              <label
                key={o.value}
                className="c360-flex c360-items-center c360-gap-1.5 c360-text-2xs"
              >
                <input
                  type="checkbox"
                  checked={draft.employmentTypes.includes(o.value)}
                  onChange={() =>
                    onDraftField(
                      "employmentTypes",
                      toggleInList(draft.employmentTypes, o.value),
                    )
                  }
                />
                {o.label}
              </label>
            ))}
          </div>
          <p className="c360-mb-1 c360-text-2xs c360-text-ink-muted">
            Legacy single type (used if none selected above)
          </p>
          <Select
            id="hsf-emp-legacy"
            value={draft.employmentType}
            onChange={(e) => onDraftField("employmentType", e.target.value)}
            options={EMPLOYMENT_OPTIONS}
            fullWidth
            inputSize="md"
            className="c360-mb-3"
          />
          <p className="c360-mb-2 c360-text-2xs c360-font-medium c360-text-ink-muted">
            Workplace
          </p>
          <div className="c360-mb-3 c360-flex c360-flex-wrap c360-gap-2">
            {WORKPLACE_OPTIONS.map((o) => (
              <label
                key={o.value}
                className="c360-flex c360-items-center c360-gap-1.5 c360-text-2xs"
              >
                <input
                  type="checkbox"
                  checked={draft.workplaceTypes.includes(o.value)}
                  onChange={() =>
                    onDraftField(
                      "workplaceTypes",
                      toggleInList(draft.workplaceTypes, o.value),
                    )
                  }
                />
                {o.label}
              </label>
            ))}
          </div>
          <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
            Seniority
          </p>
          <div className="c360-mb-2 c360-space-y-2">
            <Select
              id="hsf-seniority-preset"
              value={draft.seniorityPreset}
              onChange={(e) => onDraftField("seniorityPreset", e.target.value)}
              options={SENIORITY_PRESET_OPTIONS}
              fullWidth
              inputSize="md"
            />
            <Input
              id="hsf-seniority-custom"
              value={draft.seniorityCustom}
              onChange={(e) => onDraftField("seniorityCustom", e.target.value)}
              placeholder="Or custom seniority / regex token"
              autoComplete="off"
            />
          </div>
          <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
            Function / department
          </p>
          <div className="c360-space-y-2">
            <Select
              id="hsf-func-preset"
              value={draft.functionPreset}
              onChange={(e) => onDraftField("functionPreset", e.target.value)}
              options={FUNCTION_PRESET_OPTIONS}
              fullWidth
              inputSize="md"
            />
            <Input
              id="hsf-func-custom"
              value={draft.functionCustom}
              onChange={(e) => onDraftField("functionCustom", e.target.value)}
              placeholder="Or custom (function_category_v2)"
              autoComplete="off"
            />
          </div>
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Compensation"
          count={salaryCount}
          defaultOpen={false}
          onClear={() => onDraftField("salaryMin", "")}
        >
          <label
            htmlFor="hsf-salary-min"
            className="c360-block c360-text-2xs c360-text-ink-muted"
          >
            Minimum salary (USD / year, ingested jobs only)
          </label>
          <Input
            id="hsf-salary-min"
            type="number"
            min={0}
            value={draft.salaryMin}
            onChange={(e) => onDraftField("salaryMin", e.target.value)}
            placeholder="e.g. 120000"
            autoComplete="off"
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Industries & exclusions"
          count={
            industriesCount +
            exIndCount +
            exTitleCount +
            exCoCount +
            exLocCount
          }
          defaultOpen={false}
          onClear={() => {
            onDraftField("industries", []);
            onDraftField("excludedIndustries", []);
            onDraftField("excludedTitles", []);
            onDraftField("excludedCompanies", []);
            onDraftField("excludedLocations", []);
          }}
        >
          <label className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted">
            Industries (substring match, one per line)
          </label>
          <textarea
            className={cn(TEXTAREA_CLASS, "c360-mb-2")}
            value={draft.industries.join("\n")}
            onChange={(e) => onDraftField("industries", tokensFromLines(e.target.value))}
            spellCheck={false}
          />
          <label className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted">
            Excluded industries
          </label>
          <textarea
            className={cn(TEXTAREA_CLASS, "c360-mb-2")}
            value={draft.excludedIndustries.join("\n")}
            onChange={(e) =>
              onDraftField(
                "excludedIndustries",
                tokensFromLines(e.target.value),
              )
            }
            spellCheck={false}
          />
          <label className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted">
            Excluded titles
          </label>
          <textarea
            className={cn(TEXTAREA_CLASS, "c360-mb-2")}
            value={draft.excludedTitles.join("\n")}
            onChange={(e) =>
              onDraftField("excludedTitles", tokensFromLines(e.target.value))
            }
            spellCheck={false}
          />
          <label className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted">
            Excluded companies
          </label>
          <textarea
            className={cn(TEXTAREA_CLASS, "c360-mb-2")}
            value={draft.excludedCompanies.join("\n")}
            onChange={(e) =>
              onDraftField(
                "excludedCompanies",
                tokensFromLines(e.target.value),
              )
            }
            spellCheck={false}
          />
          <label className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted">
            Excluded locations
          </label>
          <textarea
            className={cn(TEXTAREA_CLASS)}
            value={draft.excludedLocations.join("\n")}
            onChange={(e) =>
              onDraftField(
                "excludedLocations",
                tokensFromLines(e.target.value),
              )
            }
            spellCheck={false}
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Experience & education"
          count={expBucketCount + eduCount + roleTrackCount}
          defaultOpen={false}
          onClear={() => {
            onDraftField("experienceBuckets", []);
            onDraftField("educationLevelMins", []);
            onDraftField("roleTracks", []);
          }}
        >
          <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
            Experience bucket (from ingest)
          </p>
          <div className="c360-mb-3 c360-flex c360-flex-wrap c360-gap-2">
            {EXPERIENCE_BUCKET_OPTIONS.map((o) => (
              <label
                key={o.value}
                className="c360-flex c360-items-center c360-gap-1.5 c360-text-2xs"
              >
                <input
                  type="checkbox"
                  checked={draft.experienceBuckets.includes(o.value)}
                  onChange={() =>
                    onDraftField(
                      "experienceBuckets",
                      toggleInList(draft.experienceBuckets, o.value),
                    )
                  }
                />
                {o.label}
              </label>
            ))}
          </div>
          <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
            Role track (from title / description)
          </p>
          <div className="c360-mb-3 c360-flex c360-flex-wrap c360-gap-2">
            {ROLE_TRACK_OPTIONS.map((o) => (
              <label
                key={o.value}
                className="c360-flex c360-items-center c360-gap-1.5 c360-text-2xs"
              >
                <input
                  type="checkbox"
                  checked={draft.roleTracks.includes(o.value)}
                  onChange={() =>
                    onDraftField(
                      "roleTracks",
                      toggleInList(draft.roleTracks, o.value),
                    )
                  }
                />
                {o.label}
              </label>
            ))}
          </div>
          <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
            Minimum education (job posting mentions)
          </p>
          <div className="c360-flex c360-flex-wrap c360-gap-2">
            {EDUCATION_MIN_OPTIONS.map((o) => (
              <label
                key={o.value}
                className="c360-flex c360-items-center c360-gap-1.5 c360-text-2xs"
              >
                <input
                  type="checkbox"
                  checked={draft.educationLevelMins.includes(o.value)}
                  onChange={() =>
                    onDraftField(
                      "educationLevelMins",
                      toggleInList(draft.educationLevelMins, o.value),
                    )
                  }
                />
                {o.label}
              </label>
            ))}
          </div>
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Compliance & preferences"
          count={clearanceCount + h1bCount + skillsCount}
          defaultOpen={false}
          onClear={() => {
            onDraftField("clearanceMode", "");
            onDraftField("h1bOnly", false);
            onDraftField("skillsAll", []);
          }}
        >
          <Select
            id="hsf-clearance"
            value={draft.clearanceMode}
            onChange={(e) => onDraftField("clearanceMode", e.target.value)}
            options={CLEARANCE_OPTIONS}
            fullWidth
            inputSize="md"
          />
          <p className="c360-mt-2 c360-text-2xs c360-text-ink-muted">
            Clearance flags are inferred from job text (see docs).
          </p>
          <label className="c360-mt-3 c360-flex c360-items-center c360-gap-2 c360-text-2xs">
            <input
              type="checkbox"
              checked={draft.h1bOnly}
              onChange={(e) => onDraftField("h1bOnly", e.target.checked)}
            />
            H1B / sponsorship mentioned
          </label>
          <label className="c360-mt-2 c360-block c360-text-2xs c360-text-ink-muted">
            Skills (all must match ingested skill tags)
          </label>
          <textarea
            className={TEXTAREA_CLASS}
            value={draft.skillsAll.join("\n")}
            onChange={(e) =>
              onDraftField("skillsAll", tokensFromLines(e.target.value))
            }
            spellCheck={false}
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Posted date"
          count={
            (draft.postedAfter.trim() ? 1 : 0) +
            (draft.postedBefore.trim() ? 1 : 0)
          }
          defaultOpen={false}
          onClear={() => {
            onDraftField("postedAfter", "");
            onDraftField("postedBefore", "");
          }}
        >
          <label
            htmlFor="hsf-posted-after"
            className="c360-block c360-text-2xs c360-text-ink-muted"
          >
            Posted after
          </label>
          <Input
            id="hsf-posted-after"
            type="date"
            value={draft.postedAfter}
            onChange={(e) => onDraftField("postedAfter", e.target.value)}
            className="c360-mb-2"
          />
          <label
            htmlFor="hsf-posted-before"
            className="c360-block c360-text-2xs c360-text-ink-muted"
          >
            Posted before
          </label>
          <Input
            id="hsf-posted-before"
            type="date"
            value={draft.postedBefore}
            onChange={(e) => onDraftField("postedBefore", e.target.value)}
          />
        </ContactsCollapsibleFilterSection>
      </div>
    </div>
  );
}

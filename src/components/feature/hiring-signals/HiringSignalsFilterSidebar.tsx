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

  draft.titles.forEach((rawT, i) => {
    const t = rawT.trim();
    if (!t) return;
    addChip(`title-${i}-${t}`, `Title: ${t}`, () => {
      onDraftField(
        "titles",
        draft.titles.filter((_, j) => j !== i),
      );
    });
  });
  draft.companies.forEach((rawC, i) => {
    const c = rawC.trim();
    if (!c) return;
    addChip(`company-${i}-${c}`, `Company: ${c}`, () => {
      onDraftField(
        "companies",
        draft.companies.filter((_, j) => j !== i),
      );
    });
  });
  draft.locations.forEach((rawL, i) => {
    const loc = rawL.trim();
    if (!loc) return;
    addChip(`loc-${i}-${loc}`, `Location: ${loc}`, () => {
      onDraftField(
        "locations",
        draft.locations.filter((_, j) => j !== i),
      );
    });
  });
  if (draft.employmentType.trim())
    addChip("emp", `Type: ${draft.employmentType}`, () =>
      onDraftField("employmentType", ""),
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

        <p className="c360-hs-filters__text-hint c360-text-2xs c360-text-ink-muted">
          Search to load values from the server. Multiple selections match{" "}
          <strong>any</strong> value within title, company, or location; filters
          are combined across categories.
        </p>

        <ContactsCollapsibleFilterSection
          title="Employment type"
          count={draft.employmentType.trim() ? 1 : 0}
          defaultOpen
          onClear={() => onDraftField("employmentType", "")}
        >
          <Select
            id="hsf-emp"
            value={draft.employmentType}
            onChange={(e) => onDraftField("employmentType", e.target.value)}
            options={EMPLOYMENT_OPTIONS}
            fullWidth
            inputSize="md"
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Seniority"
          count={seniorityCount}
          defaultOpen
          onClear={() => {
            onDraftField("seniorityPreset", "");
            onDraftField("seniorityCustom", "");
          }}
        >
          <div className="c360-space-y-2">
            <Select
              id="hsf-seniority-preset"
              value={draft.seniorityPreset}
              onChange={(e) => onDraftField("seniorityPreset", e.target.value)}
              options={SENIORITY_PRESET_OPTIONS}
              fullWidth
              inputSize="md"
            />
            <label
              htmlFor="hsf-seniority-custom"
              className="c360-block c360-text-2xs c360-text-ink-muted"
            >
              Or custom (overrides preset when filled)
            </label>
            <Input
              id="hsf-seniority-custom"
              value={draft.seniorityCustom}
              onChange={(e) => onDraftField("seniorityCustom", e.target.value)}
              placeholder="e.g. Principal"
              autoComplete="off"
            />
          </div>
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Function / department"
          count={functionCount}
          defaultOpen
          onClear={() => {
            onDraftField("functionPreset", "");
            onDraftField("functionCustom", "");
          }}
        >
          <div className="c360-space-y-2">
            <Select
              id="hsf-func-preset"
              value={draft.functionPreset}
              onChange={(e) => onDraftField("functionPreset", e.target.value)}
              options={FUNCTION_PRESET_OPTIONS}
              fullWidth
              inputSize="md"
            />
            <label
              htmlFor="hsf-func-custom"
              className="c360-block c360-text-2xs c360-text-ink-muted"
            >
              Or custom (overrides preset when filled)
            </label>
            <Input
              id="hsf-func-custom"
              value={draft.functionCustom}
              onChange={(e) => onDraftField("functionCustom", e.target.value)}
              placeholder="Matches function_category_v2"
              autoComplete="off"
            />
          </div>
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Posted after"
          count={draft.postedAfter.trim() ? 1 : 0}
          defaultOpen
          onClear={() => onDraftField("postedAfter", "")}
        >
          <Input
            id="hsf-posted-after"
            type="date"
            value={draft.postedAfter}
            onChange={(e) => onDraftField("postedAfter", e.target.value)}
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Posted before"
          count={draft.postedBefore.trim() ? 1 : 0}
          defaultOpen
          onClear={() => onDraftField("postedBefore", "")}
        >
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

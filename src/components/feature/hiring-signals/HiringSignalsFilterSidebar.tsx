"use client";

import { Filter, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import type {
  HiringSignalDraftField,
  HiringSignalFilterDraft,
} from "@/components/feature/hiring-signals/hiringSignalFilterDraft";

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

function countTextSection(d: HiringSignalFilterDraft): number {
  return ["title", "company", "location"].filter((k) =>
    String(d[k as HiringSignalDraftField]).trim(),
  ).length;
}

function countRoleSection(d: HiringSignalFilterDraft): number {
  let n = 0;
  if (d.employmentType.trim()) n += 1;
  if (d.seniorityPreset.trim() || d.seniorityCustom.trim()) n += 1;
  if (d.functionPreset.trim() || d.functionCustom.trim()) n += 1;
  return n;
}

function countDateSection(d: HiringSignalFilterDraft): number {
  return [d.postedAfter, d.postedBefore].filter((x) => x.trim()).length;
}

export interface HiringSignalsFilterSidebarProps {
  onApply: () => void;
  /** Active Apify run filter (from Runs tab drill-down). */
  appliedRunId?: string;
  onClearRunId?: () => void;
  className?: string;
}

export function HiringSignalsFilterSidebar({
  onApply,
  appliedRunId,
  onClearRunId,
  className,
}: HiringSignalsFilterSidebarProps) {
  const { draft, onDraftField, resetFilters, activeDraftCount } =
    useHireSignalFilter();

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  const addChip = (key: string, label: string, clear: () => void) => {
    chips.push({ key, label, onRemove: clear });
  };

  if (draft.title.trim())
    addChip("title", `Title: ${draft.title.trim()}`, () =>
      onDraftField("title", ""),
    );
  if (draft.company.trim())
    addChip("company", `Company: ${draft.company.trim()}`, () =>
      onDraftField("company", ""),
    );
  if (draft.location.trim())
    addChip("loc", `Location: ${draft.location.trim()}`, () =>
      onDraftField("location", ""),
    );
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

  return (
    <Card className={cn("c360-p-4 c360-h-full", className)}>
      <div className="c360-mb-3 c360-flex c360-items-center c360-justify-between">
        <h2
          id="c360-filter-drawer-title"
          className="c360-m-0 c360-flex c360-items-center c360-gap-2 c360-text-sm c360-font-medium c360-text-ink"
        >
          <Filter size={16} aria-hidden />
          Refine signals
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="c360-gap-1"
          onClick={resetFilters}
        >
          <RotateCcw size={14} />
          Clear
        </Button>
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

      <div className="c360-space-y-2">
        <ContactsCollapsibleFilterSection
          title="Text filters"
          count={countTextSection(draft)}
          defaultOpen
          onClear={() => {
            onDraftField("title", "");
            onDraftField("company", "");
            onDraftField("location", "");
          }}
        >
          <div className="c360-space-y-3">
            <div>
              <label
                htmlFor="hsf-title"
                className="c360-mb-1 c360-block c360-text-2xs c360-font-medium c360-text-ink-muted c360-uppercase c360-tracking-wide"
              >
                Job title
              </label>
              <Input
                id="hsf-title"
                value={draft.title}
                onChange={(e) => onDraftField("title", e.target.value)}
                placeholder="Role keywords"
                autoComplete="off"
              />
            </div>
            <div>
              <label
                htmlFor="hsf-company"
                className="c360-mb-1 c360-block c360-text-2xs c360-font-medium c360-text-ink-muted c360-uppercase c360-tracking-wide"
              >
                Company
              </label>
              <Input
                id="hsf-company"
                value={draft.company}
                onChange={(e) => onDraftField("company", e.target.value)}
                placeholder="Company name"
                autoComplete="organization"
              />
            </div>
            <div>
              <label
                htmlFor="hsf-loc"
                className="c360-mb-1 c360-block c360-text-2xs c360-font-medium c360-text-ink-muted c360-uppercase c360-tracking-wide"
              >
                Location
              </label>
              <Input
                id="hsf-loc"
                value={draft.location}
                onChange={(e) => onDraftField("location", e.target.value)}
                placeholder="City / region"
                autoComplete="off"
              />
            </div>
          </div>
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Role filters"
          count={countRoleSection(draft)}
          onClear={() => {
            onDraftField("employmentType", "");
            onDraftField("seniorityPreset", "");
            onDraftField("seniorityCustom", "");
            onDraftField("functionPreset", "");
            onDraftField("functionCustom", "");
          }}
        >
          <div className="c360-space-y-3">
            <div>
              <label
                htmlFor="hsf-emp"
                className="c360-mb-1 c360-block c360-text-2xs c360-font-medium c360-text-ink-muted c360-uppercase c360-tracking-wide"
              >
                Employment type
              </label>
              <Select
                id="hsf-emp"
                value={draft.employmentType}
                onChange={(e) => onDraftField("employmentType", e.target.value)}
                options={EMPLOYMENT_OPTIONS}
                fullWidth
                inputSize="md"
              />
            </div>
            <div>
              <label
                htmlFor="hsf-seniority-preset"
                className="c360-mb-1 c360-block c360-text-2xs c360-font-medium c360-text-ink-muted c360-uppercase c360-tracking-wide"
              >
                Seniority
              </label>
              <Select
                id="hsf-seniority-preset"
                value={draft.seniorityPreset}
                onChange={(e) =>
                  onDraftField("seniorityPreset", e.target.value)
                }
                options={SENIORITY_PRESET_OPTIONS}
                fullWidth
                inputSize="md"
              />
              <label
                htmlFor="hsf-seniority-custom"
                className="c360-mt-2 c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted"
              >
                Or custom (overrides preset when filled)
              </label>
              <Input
                id="hsf-seniority-custom"
                value={draft.seniorityCustom}
                onChange={(e) =>
                  onDraftField("seniorityCustom", e.target.value)
                }
                placeholder="e.g. Principal"
                autoComplete="off"
              />
            </div>
            <div>
              <label
                htmlFor="hsf-func-preset"
                className="c360-mb-1 c360-block c360-text-2xs c360-font-medium c360-text-ink-muted c360-uppercase c360-tracking-wide"
              >
                Function / department
              </label>
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
                className="c360-mt-2 c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted"
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
          </div>
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Date range"
          count={countDateSection(draft)}
          onClear={() => {
            onDraftField("postedAfter", "");
            onDraftField("postedBefore", "");
          }}
        >
          <div className="c360-grid c360-gap-2">
            <div>
              <label
                htmlFor="hsf-posted-after"
                className="c360-mb-1 c360-block c360-text-2xs c360-font-medium c360-text-ink-muted c360-uppercase c360-tracking-wide"
              >
                Posted after
              </label>
              <Input
                id="hsf-posted-after"
                type="date"
                value={draft.postedAfter}
                onChange={(e) => onDraftField("postedAfter", e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="hsf-posted-before"
                className="c360-mb-1 c360-block c360-text-2xs c360-font-medium c360-text-ink-muted c360-uppercase c360-tracking-wide"
              >
                Posted before
              </label>
              <Input
                id="hsf-posted-before"
                type="date"
                value={draft.postedBefore}
                onChange={(e) => onDraftField("postedBefore", e.target.value)}
              />
            </div>
          </div>
        </ContactsCollapsibleFilterSection>

        <Button
          type="button"
          variant="primary"
          className="c360-w-full c360-mt-2"
          onClick={onApply}
        >
          Apply filters
        </Button>
        {activeDraftCount === 0 && !appliedRunId ? (
          <p className="c360-m-0 c360-text-2xs c360-text-ink-muted">
            Set filters above, then Apply. Toolbar “New (7 days)” adds a posted
            date preset on the signals list.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

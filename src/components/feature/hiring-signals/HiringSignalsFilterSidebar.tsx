"use client";

import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

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

export type HiringSignalFilterDraft = {
  title: string;
  company: string;
  location: string;
  employmentType: string;
  seniorityPreset: string;
  seniorityCustom: string;
  functionPreset: string;
  functionCustom: string;
  postedAfter: string;
  postedBefore: string;
};

export const EMPTY_HIRING_SIGNAL_DRAFT: HiringSignalFilterDraft = {
  title: "",
  company: "",
  location: "",
  employmentType: "",
  seniorityPreset: "",
  seniorityCustom: "",
  functionPreset: "",
  functionCustom: "",
  postedAfter: "",
  postedBefore: "",
};

export type HiringSignalDraftField = keyof HiringSignalFilterDraft;

export interface HiringSignalsFilterSidebarProps {
  values: HiringSignalFilterDraft;
  onChange: (field: HiringSignalDraftField, value: string) => void;
  onApply: () => void;
  onReset: () => void;
  className?: string;
}

export function HiringSignalsFilterSidebar({
  values,
  onChange,
  onApply,
  onReset,
  className,
}: HiringSignalsFilterSidebarProps) {
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
          onClick={onReset}
        >
          <RotateCcw size={14} />
          Clear
        </Button>
      </div>

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
            value={values.title}
            onChange={(e) => onChange("title", e.target.value)}
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
            value={values.company}
            onChange={(e) => onChange("company", e.target.value)}
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
            value={values.location}
            onChange={(e) => onChange("location", e.target.value)}
            placeholder="City / region"
            autoComplete="off"
          />
        </div>
        <div>
          <label
            htmlFor="hsf-emp"
            className="c360-mb-1 c360-block c360-text-2xs c360-font-medium c360-text-ink-muted c360-uppercase c360-tracking-wide"
          >
            Employment type
          </label>
          <Select
            id="hsf-emp"
            value={values.employmentType}
            onChange={(e) => onChange("employmentType", e.target.value)}
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
            value={values.seniorityPreset}
            onChange={(e) => onChange("seniorityPreset", e.target.value)}
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
            value={values.seniorityCustom}
            onChange={(e) => onChange("seniorityCustom", e.target.value)}
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
            value={values.functionPreset}
            onChange={(e) => onChange("functionPreset", e.target.value)}
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
            value={values.functionCustom}
            onChange={(e) => onChange("functionCustom", e.target.value)}
            placeholder="Matches function_category_v2"
            autoComplete="off"
          />
        </div>
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
              value={values.postedAfter}
              onChange={(e) => onChange("postedAfter", e.target.value)}
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
              value={values.postedBefore}
              onChange={(e) => onChange("postedBefore", e.target.value)}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          className="c360-w-full c360-mt-2"
          onClick={onApply}
        >
          Apply filters
        </Button>
      </div>
    </Card>
  );
}

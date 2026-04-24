"use client";

import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";

export interface HiringSignalsFilterSidebarProps {
  values: {
    title: string;
    company: string;
    location: string;
    employmentType: string;
  };
  onChange: (field: keyof JobListFilters, value: string) => void;
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
      <div className="c360-mb-3 flex items-center justify-between">
        <div className="c360-flex c360-items-center c360-gap-2 c360-text-sm c360-font-medium c360-text-ink">
          <Filter size={16} aria-hidden />
          Filters
        </div>
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
            className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted"
          >
            Title
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
            className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted"
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
            className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted"
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
            className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted"
          >
            Employment type
          </label>
          <Input
            id="hsf-emp"
            value={values.employmentType}
            onChange={(e) => onChange("employmentType", e.target.value)}
            placeholder="e.g. Full-time"
            autoComplete="off"
          />
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

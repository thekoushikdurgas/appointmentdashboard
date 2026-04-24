"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export interface HiringSignalStatsBarProps {
  totalJobs: number;
  jobsWithCompany: number;
  loading?: boolean;
  className?: string;
}

export function HiringSignalStatsBar({
  totalJobs,
  jobsWithCompany,
  loading,
  className,
}: HiringSignalStatsBarProps) {
  return (
    <div
      className={cn(
        "c360-filters-row c360-mb-4 grid gap-3 sm:grid-cols-2",
        className,
      )}
    >
      <Card className="c360-p-4" data-state={loading ? "loading" : undefined}>
        <p className="c360-text-2xs c360-mb-1 c360-text-ink-muted c360-uppercase">
          Jobs indexed
        </p>
        <p className="c360-text-xl c360-font-semibold c360-text-ink">
          {loading ? "—" : totalJobs.toLocaleString()}
        </p>
      </Card>
      <Card className="c360-p-4" data-state={loading ? "loading" : undefined}>
        <p className="c360-text-2xs c360-mb-1 c360-text-ink-muted c360-uppercase">
          With company link
        </p>
        <p className="c360-text-xl c360-font-semibold c360-text-ink">
          {loading ? "—" : jobsWithCompany.toLocaleString()}
        </p>
      </Card>
    </div>
  );
}

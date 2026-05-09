"use client";

import { Briefcase, DollarSign, Globe2, Building2, Home } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { cn } from "@/lib/utils";

export type HiringDashboardKpis = {
  total_jobs?: number;
  jobs_with_salary?: number;
  median_salary_min_usd?: number;
  remote_count?: number;
  distinct_countries?: number;
  distinct_companies?: number;
};

function fmtUsd(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export interface HiringKpiStripProps {
  data: HiringDashboardKpis | null;
  loading?: boolean;
  /** When true, derive median label from jobs_with_salary when present. */
  className?: string;
}

export function HiringKpiStrip({
  data,
  loading,
  className,
}: HiringKpiStripProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "c360-dashboard-layout__stats c360-dashboard-layout__stats--home",
          className,
        )}
        aria-busy="true"
      >
        <div className="c360-spinner" />
      </div>
    );
  }

  const total = data?.total_jobs ?? 0;
  const median = data?.median_salary_min_usd;
  const withSal = data?.jobs_with_salary;
  const remote = data?.remote_count ?? 0;
  const countries = data?.distinct_countries ?? 0;
  const companies = data?.distinct_companies ?? 0;

  return (
    <>
      <div
        className={cn(
          "c360-flex c360-flex-wrap c360-gap-4 c360-hiring-kpi-strip",
          className,
        )}
        role="list"
        aria-label="Hiring signal KPIs"
      >
        <StatCard
          label="Hiring signals indexed"
          value={total}
          icon={<Briefcase size={20} />}
          iconBg="rgba(43,193,85,0.12)"
          iconColor="var(--c360-success)"
        />
        <StatCard
          label="Median salary (min USD)"
          value={median != null ? fmtUsd(median) : "—"}
          icon={<DollarSign size={20} />}
          iconBg="rgba(181,25,236,0.12)"
          iconColor="var(--c360-accent)"
        />
        <StatCard
          label="Remote-eligible"
          value={remote}
          icon={<Home size={20} />}
          iconBg="rgba(59,130,246,0.12)"
          iconColor="var(--c360-info)"
        />
        <StatCard
          label="Countries"
          value={countries}
          icon={<Globe2 size={20} />}
          iconBg="rgba(255,109,77,0.12)"
          iconColor="var(--c360-warning)"
        />
        <StatCard
          label="Companies hiring"
          value={companies}
          icon={<Building2 size={20} />}
          iconBg="var(--c360-primary-light)"
          iconColor="var(--c360-primary)"
        />
      </div>
      {withSal != null && withSal > 0 ? (
        <p className="c360-text-xs c360-text-muted c360-mt-2">
          Salary KPI based on {withSal.toLocaleString()} postings with min
          salary data.
        </p>
      ) : null}
    </>
  );
}

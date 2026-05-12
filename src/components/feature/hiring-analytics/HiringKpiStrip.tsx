"use client";

import { Briefcase, DollarSign, Globe2, Building2, Home } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { cn } from "@/lib/utils";

export type HiringDashboardKpis = {
  total_jobs?: number;
  /** Filter-scoped total from list API (may exceed loaded rows). */
  matching_postings_total?: number;
  /** Rows currently in memory (charts aggregate this set). */
  loaded_rows?: number;
  jobs_with_salary?: number;
  median_salary_min_usd?: number;
  remote_count?: number;
  distinct_countries?: number;
  distinct_companies?: number;
  /** Whole Mongo corpus (job.server / Connectra ingestion pipeline). */
  global_indexed_jobs?: number;
  global_jobs_with_company?: number;
  global_median_salary_min_usd?: number;
  /** When set, loaded_rows stopped at this cap while the server reported more matches. */
  analytics_match_capped_at?: number | null;
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

  const matchingRaw = data?.matching_postings_total;
  const useMatchingHeadline =
    matchingRaw != null && Number.isFinite(matchingRaw);
  const headlineTotal = useMatchingHeadline
    ? Math.max(0, Math.floor(Number(matchingRaw)))
    : (data?.total_jobs ?? 0);
  const firstLabel = useMatchingHeadline
    ? "Matching postings"
    : "Hiring signals indexed";
  const median = data?.median_salary_min_usd;
  const withSal = data?.jobs_with_salary;
  const remote = data?.remote_count ?? 0;
  const countries = data?.distinct_countries ?? 0;
  const companies = data?.distinct_companies ?? 0;
  const gIdx = data?.global_indexed_jobs;
  const gCo = data?.global_jobs_with_company;
  const gMed = data?.global_median_salary_min_usd;
  const capAt = data?.analytics_match_capped_at;

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
          label={firstLabel}
          value={headlineTotal}
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
      {data?.loaded_rows != null &&
      data.matching_postings_total != null &&
      data.loaded_rows < data.matching_postings_total ? (
        <p className="c360-text-xs c360-text-muted c360-mt-2">
          Charts aggregate {data.loaded_rows.toLocaleString()} loaded postings (
          {data.matching_postings_total.toLocaleString()} match current
          filters).
        </p>
      ) : null}
      {capAt != null && capAt > 0 ? (
        <p className="c360-text-xs c360-text-muted c360-mt-2">
          Match list capped at {capAt.toLocaleString()} rows in the browser;
          narrow filters to analyze a smaller slice.
        </p>
      ) : null}
      {gIdx != null && gIdx > 0 ? (
        <p className="c360-text-xs c360-text-muted c360-mt-2">
          Corpus-wide (job index): {gIdx.toLocaleString()} jobs indexed ·{" "}
          {gCo != null ? gCo.toLocaleString() : "—"} with company UUID (company
          graph / sync).{" "}
          {gMed != null && Number.isFinite(gMed)
            ? `Median min salary (corpus): ${fmtUsd(gMed)}.`
            : ""}
        </p>
      ) : null}
    </>
  );
}

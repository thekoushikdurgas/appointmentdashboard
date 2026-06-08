"use client";

import {
  Briefcase,
  Building2,
  Filter,
  LayoutGrid,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { CountUpNumber } from "@/components/ui/CountUpNumber";
import { Progress } from "@/components/ui/Progress";
import { applyVars } from "@/lib/applyCssVars";
import { cn } from "@/lib/utils";

export interface HiringSignalStatsBarProps {
  totalJobs: number;
  jobsWithCompany: number;
  /** Total rows matching current filters (all pages). */
  filterMatchTotal: number;
  /** Rows on the current page (for “On this page” card). */
  pageRowCount: number;
  loading?: boolean;
  className?: string;
}

function TrendChip({
  direction,
  label,
}: {
  direction: "up" | "down";
  label: string;
}) {
  const Icon = direction === "up" ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "c360-stat-card__trend",
        direction === "up"
          ? "c360-stat-card__trend--up"
          : "c360-stat-card__trend--down",
      )}
    >
      <Icon size={14} aria-hidden />
      {label}
    </span>
  );
}

export function HiringSignalStatsBar({
  totalJobs,
  jobsWithCompany,
  filterMatchTotal,
  pageRowCount,
  loading,
  className,
}: HiringSignalStatsBarProps) {
  const filterDepth =
    totalJobs > 0
      ? Math.min(100, Math.round((filterMatchTotal / totalJobs) * 100))
      : 0;

  return (
    <div
      className={cn(
        "c360-stat-grid c360-stat-grid--wide c360-hs-stats-grid",
        className,
      )}
      role="list"
      aria-label="Hiring signals summary"
    >
      <article
        className="c360-stat-card"
        data-state={loading ? "loading" : undefined}
        role="listitem"
      >
        <div className="c360-stat-card__headline">
          <p className="c360-stat-card__metric-title">Jobs indexed</p>
          <div
            className="c360-stat-card__headline-icon"
            ref={(el) =>
              applyVars(el, {
                "--c360-stat-icon-bg": "var(--c360-primary-light)",
                "--c360-stat-icon-fg": "var(--c360-primary)",
              })
            }
          >
            <Briefcase size={18} aria-hidden />
          </div>
        </div>
        <div className="c360-stat-card__value-row">
          <p className="c360-stat-card__value">
            {loading ? "—" : <CountUpNumber end={totalJobs} duration={900} />}
          </p>
          {!loading && totalJobs > 0 ? (
            <TrendChip direction="up" label="Indexed" />
          ) : null}
        </div>
        <p className="c360-stat-card__description">
          Total rows in job.server Mongo
        </p>
      </article>

      <article
        className="c360-stat-card"
        data-state={loading ? "loading" : undefined}
        role="listitem"
      >
        <div className="c360-stat-card__headline">
          <p className="c360-stat-card__metric-title">With company link</p>
          <div
            className="c360-stat-card__headline-icon"
            ref={(el) =>
              applyVars(el, {
                "--c360-stat-icon-bg": "var(--c360-success-light)",
                "--c360-stat-icon-fg": "var(--c360-success)",
              })
            }
          >
            <Building2 size={18} aria-hidden />
          </div>
        </div>
        <div className="c360-stat-card__value-row">
          <p className="c360-stat-card__value">
            {loading ? (
              "—"
            ) : (
              <CountUpNumber end={jobsWithCompany} duration={900} />
            )}
          </p>
        </div>
        <Progress
          value={jobsWithCompany}
          max={totalJobs || 1}
          size="sm"
          color="primary"
          showValue
          label="Linked to company"
          className="c360-mt-2"
        />
        <p className="c360-stat-card__description">
          Linked to Connectra company_uuid
        </p>
      </article>

      <article
        className="c360-stat-card"
        data-state={loading ? "loading" : undefined}
        role="listitem"
      >
        <div className="c360-stat-card__headline">
          <p className="c360-stat-card__metric-title">Filter matches</p>
          <div
            className="c360-stat-card__headline-icon"
            ref={(el) =>
              applyVars(el, {
                "--c360-stat-icon-bg": "var(--c360-warning-light)",
                "--c360-stat-icon-fg": "var(--c360-warning)",
              })
            }
          >
            <Filter size={18} aria-hidden />
          </div>
        </div>
        <div className="c360-stat-card__value-row">
          <p className="c360-stat-card__value">
            {loading ? (
              "—"
            ) : (
              <CountUpNumber end={filterMatchTotal} duration={900} />
            )}
          </p>
          {!loading && totalJobs > 0 && filterMatchTotal > 0 ? (
            <TrendChip
              direction={filterDepth >= 50 ? "up" : "down"}
              label={`${filterDepth}%`}
            />
          ) : null}
        </div>
        <p className="c360-stat-card__description">
          Rows matching current filters (all pages)
        </p>
      </article>

      <article
        className="c360-stat-card"
        data-state={loading ? "loading" : undefined}
        role="listitem"
      >
        <div className="c360-stat-card__headline">
          <p className="c360-stat-card__metric-title">Active signals (page)</p>
          <div
            className="c360-stat-card__headline-icon"
            ref={(el) =>
              applyVars(el, {
                "--c360-stat-icon-bg": "var(--c360-info-light)",
                "--c360-stat-icon-fg": "var(--c360-info)",
              })
            }
          >
            <LayoutGrid size={18} aria-hidden />
          </div>
        </div>
        <div className="c360-stat-card__value-row">
          <p className="c360-stat-card__value">
            {loading ? (
              "—"
            ) : (
              <CountUpNumber end={pageRowCount} duration={600} />
            )}
          </p>
          {!loading && pageRowCount > 0 ? (
            <TrendChip direction="up" label="Page" />
          ) : null}
        </div>
        <p className="c360-stat-card__description">
          Roles visible on the current results page
        </p>
      </article>
    </div>
  );
}

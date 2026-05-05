"use client";

import { isValidElement, cloneElement } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { applyVars } from "@/lib/applyCssVars";
import { CountUpNumber } from "@/components/ui/CountUpNumber";
import { SparklineChart } from "@/components/shared/SparklineChart";
import { cn } from "@/lib/utils";

export interface StatCardData {
  label: string;
  value: number;
  trend: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  sparkData: Array<{ value: number }>;
  sparkColor: string;
  /** Muted supporting line under the value (data-card pattern). */
  description?: string;
}

interface DashboardStatRowProps {
  stats: StatCardData[];
  loading: boolean;
}

function iconAtSize(icon: React.ReactNode, size: number): React.ReactNode {
  if (!isValidElement(icon)) return icon;
  return cloneElement(icon as React.ReactElement<{ size?: number }>, {
    size,
  });
}

export function DashboardStatRow({ stats, loading }: DashboardStatRowProps) {
  if (loading) {
    return (
      <div
        className="c360-dashboard-layout__stats c360-dashboard-layout__stats--home c360-mb-6 c360-flex c360-justify-center"
        aria-busy="true"
        aria-label="Loading account overview"
      >
        <div className="c360-spinner" />
      </div>
    );
  }

  return (
    <div
      className="c360-dashboard-layout__stats c360-dashboard-layout__stats--home c360-mb-6"
      role="list"
      aria-label="Account overview"
    >
      {stats.length === 0 && (
        <p className="c360-page-subtitle">No stats available.</p>
      )}
      {stats.map((stat) => {
        const showTrend = stat.trend !== 0;
        const isUp = stat.trend >= 0;
        const iconNode = iconAtSize(stat.icon, 18);

        return (
          <article
            key={stat.label}
            className="c360-stat-card c360-stat-card--data-card"
            role="listitem"
          >
            <div className="c360-stat-card__headline">
              <p className="c360-stat-card__metric-title">{stat.label}</p>
              <div
                className="c360-stat-card__headline-icon"
                ref={(el) =>
                  applyVars(el, {
                    "--c360-stat-icon-bg": stat.iconBg,
                    "--c360-stat-icon-fg": stat.iconColor,
                  })
                }
                aria-hidden
              >
                {iconNode}
              </div>
            </div>
            <div className="c360-stat-card__value-row">
              <p className="c360-stat-card__value">
                <CountUpNumber end={stat.value} duration={1200} />
              </p>
              {showTrend ? (
                <span
                  className={cn(
                    "c360-stat-card__trend",
                    isUp
                      ? "c360-stat-card__trend--up"
                      : "c360-stat-card__trend--down",
                  )}
                >
                  {isUp ? (
                    <ArrowUpRight size={14} aria-hidden />
                  ) : (
                    <ArrowDownRight size={14} aria-hidden />
                  )}
                  {Math.abs(stat.trend)}%
                </span>
              ) : null}
            </div>
            {stat.description ? (
              <p className="c360-stat-card__description">{stat.description}</p>
            ) : null}
            <div className="c360-mt-2 c360-min-w-0">
              <SparklineChart
                data={stat.sparkData}
                color={stat.sparkColor}
                height={36}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}

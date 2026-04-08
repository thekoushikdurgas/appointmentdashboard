"use client";

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
}

interface DashboardStatRowProps {
  stats: StatCardData[];
  loading: boolean;
}

export function DashboardStatRow({ stats, loading }: DashboardStatRowProps) {
  return (
    <div className="c360-dashboard-layout__stats c360-mb-6">
      {loading && <div className="c360-spinner c360-mx-auto" />}
      {!loading && stats.length === 0 && (
        <p className="c360-page-subtitle">No stats available.</p>
      )}
      {stats.map((stat) => (
        <div key={stat.label} className="c360-stat-card">
          <div className="c360-stat-card__header">
            <div
              className="c360-stat-card__icon"
              ref={(el) =>
                applyVars(el, {
                  "--c360-stat-icon-bg": stat.iconBg,
                  "--c360-stat-icon-fg": stat.iconColor,
                })
              }
            >
              {stat.icon}
            </div>
            <span
              className={cn(
                "c360-stat-card__trend",
                stat.trend >= 0
                  ? "c360-stat-card__trend--up"
                  : "c360-stat-card__trend--down",
              )}
            >
              {stat.trend >= 0 ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {Math.abs(stat.trend)}%
            </span>
          </div>
          <div>
            <div className="c360-stat-card__value">
              <CountUpNumber end={stat.value} duration={1200} />
            </div>
            <div className="c360-stat-card__label">{stat.label}</div>
          </div>
          <div className="c360-mt-2">
            <SparklineChart
              data={stat.sparkData}
              color={stat.sparkColor}
              height={36}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

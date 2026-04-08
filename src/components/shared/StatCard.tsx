"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyVars } from "@/lib/applyCssVars";
import { formatCompact } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: number | string;
  trend?: number;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  trend,
  icon,
  iconBg = "var(--c360-primary-light)",
  iconColor = "var(--c360-primary)",
  className,
  onClick,
}: StatCardProps) {
  const displayValue = typeof value === "number" ? formatCompact(value) : value;
  const isUp = trend !== undefined && trend >= 0;

  return (
    <div
      className={cn(
        "c360-stat-card",
        onClick && "c360-cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      <div className="c360-stat-card__header">
        {icon && (
          <div
            className="c360-stat-card__icon"
            ref={(el) =>
              applyVars(el, {
                "--c360-stat-icon-bg": iconBg,
                "--c360-stat-icon-fg": iconColor,
              })
            }
          >
            {icon}
          </div>
        )}
        {trend !== undefined && (
          <span
            className={cn(
              "c360-stat-card__trend",
              isUp
                ? "c360-stat-card__trend--up"
                : "c360-stat-card__trend--down",
            )}
          >
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div className="c360-stat-card__value">{displayValue}</div>
        <div className="c360-stat-card__label">{label}</div>
      </div>
    </div>
  );
}

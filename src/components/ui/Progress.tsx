"use client";

import { cn } from "@/lib/utils";
import { applyVars } from "@/lib/applyCssVars";

type ProgressSize = "sm" | "md" | "lg";
type ProgressColor = "primary" | "success" | "warning" | "danger";

export interface ProgressProps {
  value?: number;
  max?: number;
  size?: ProgressSize;
  color?: ProgressColor;
  label?: string;
  showValue?: boolean;
  indeterminate?: boolean;
  className?: string;
  stacked?: Array<{ value: number; color: string; label?: string }>;
}

export function Progress({
  value = 0,
  max = 100,
  size = "md",
  color = "primary",
  label,
  showValue = false,
  indeterminate = false,
  className,
  stacked,
}: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  if (stacked) {
    const total = stacked.reduce((s, item) => s + item.value, 0);
    return (
      <div className={cn("c360-progress", "c360-progress--stacked", className)}>
        {label && (
          <div className="c360-progress__header">
            <span>{label}</span>
            <span>{total}</span>
          </div>
        )}
        <div
          className={cn("c360-progress__bar", `c360-progress__bar--${size}`)}
          role="progressbar"
        >
          {stacked.map((item, i) => {
            const pctItem = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div
                key={i}
                className="c360-progress__fill"
                ref={(el) =>
                  applyVars(el, {
                    "--c360-progress-segment-pct": `${pctItem}%`,
                    "--c360-progress-segment-bg": item.color,
                  })
                }
                title={item.label ? `${item.label}: ${item.value}` : undefined}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("c360-progress", className)}>
      {(label || showValue) && (
        <div className="c360-progress__header">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={cn("c360-progress__bar", `c360-progress__bar--${size}`)}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "c360-progress__fill",
            color !== "primary" && `c360-progress__fill--${color}`,
            indeterminate && "c360-progress__fill--indeterminate",
          )}
          ref={(el) =>
            applyVars(el, {
              "--c360-progress-fill-pct": indeterminate ? null : `${pct}%`,
            })
          }
        />
      </div>
    </div>
  );
}

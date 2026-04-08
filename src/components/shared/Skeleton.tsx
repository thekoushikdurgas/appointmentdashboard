"use client";

import { cn } from "@/lib/utils";
import { applyVars } from "@/lib/applyCssVars";

export interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  circle?: boolean;
}

export function Skeleton({ className, width, height, circle }: SkeletonProps) {
  const computedHeight = height ?? (circle ? width : 16);
  const toLen = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

  return (
    <div
      className={cn("c360-skeleton", className)}
      ref={(el) =>
        applyVars(el, {
          ...(width !== undefined && {
            "--c360-skeleton-w": toLen(width),
          }),
          ...(computedHeight !== undefined && {
            "--c360-skeleton-h": toLen(computedHeight),
          }),
          ...(circle ? { "--c360-skeleton-radius": "50%" } : {}),
        })
      }
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="c360-card c360-p-6">
      <div className="c360-flex c360-gap-3 c360-mb-4">
        <Skeleton circle width={40} />
        <div className="c360-flex-1 c360-flex-col c360-gap-2">
          <Skeleton height={16} width="60%" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
      <Skeleton className="c360-mb-2" height={8} />
      <Skeleton height={8} width="80%" />
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="c360-table-wrapper">
      <table className="c360-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <Skeleton height={12} width={80} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <Skeleton height={14} width={c === 0 ? 150 : 80} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

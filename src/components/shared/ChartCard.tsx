"use client";

import { Card } from "@/components/ui/Card";
import { useCSSVars } from "@/hooks/useCSSVars";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  height?: number;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  actions,
  height = 240,
  loading = false,
  empty = false,
  emptyMessage = "No data available for this period.",
  children,
  className,
}: ChartCardProps) {
  const viewportRef = useCSSVars<HTMLDivElement>({
    "--c360-chart-viewport-h": `${height}px`,
  });
  return (
    <Card
      title={title}
      subtitle={subtitle}
      actions={actions}
      className={cn(className)}
    >
      <div ref={viewportRef} className="c360-chart-card__viewport">
        {loading ? (
          <div className="c360-chart-card__overlay">
            <span className="c360-spinner" />
          </div>
        ) : empty ? (
          <div className="c360-chart-card__empty">{emptyMessage}</div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

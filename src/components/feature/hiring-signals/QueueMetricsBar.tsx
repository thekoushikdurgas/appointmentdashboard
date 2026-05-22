"use client";

import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export interface QueueMetricsBarProps {
  metrics: Record<string, unknown> | null;
  loading: boolean;
  className?: string;
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function QueueMetricsBar({
  metrics,
  loading,
  className,
}: QueueMetricsBarProps) {
  const pending = metrics ? num(metrics.pending) : 0;
  const running = metrics ? num(metrics.running) : 0;
  const paused = metrics ? num(metrics.paused) : 0;
  const done = metrics ? num(metrics.done) : 0;
  const failed = metrics ? num(metrics.failed) : 0;
  const cancelled = metrics ? num(metrics.cancelled) : 0;
  const total =
    metrics && num(metrics.total) > 0
      ? num(metrics.total)
      : pending + running + paused + done + failed + cancelled;
  const queueDepth = metrics ? num(metrics.broker_queue_depth) : 0;

  const stacked =
    total > 0
      ? [
          {
            value: pending,
            color: "var(--c360-warning-raw, #eab308)",
            label: "Pending",
          },
          {
            value: running,
            color: "var(--c360-primary-raw, #6366f1)",
            label: "Running",
          },
          {
            value: paused,
            color: "var(--c360-info-raw, #0ea5e9)",
            label: "Paused",
          },
          {
            value: done,
            color: "var(--c360-success-raw, #22c55e)",
            label: "Done",
          },
          {
            value: failed,
            color: "var(--c360-danger-raw, #ef4444)",
            label: "Failed",
          },
          {
            value: cancelled,
            color: "var(--c360-muted-raw, #94a3b8)",
            label: "Cancelled",
          },
        ].filter((s) => s.value > 0)
      : [];

  return (
    <Card className={cn("c360-hs-queue-metrics-card c360-p-4", className)}>
      <div className="c360-mb-3 c360-flex c360-flex-wrap c360-items-center c360-justify-between c360-gap-2">
        <span className="c360-text-2xs c360-font-semibold c360-uppercase c360-tracking-wide c360-text-muted">
          Scraper queue &amp; sessions
        </span>
        {loading ? (
          <span className="c360-text-2xs c360-text-muted">Loading…</span>
        ) : (
          <span className="c360-text-2xs c360-text-muted">
            Broker depth:{" "}
            <strong className="c360-font-medium c360-text-ink">
              {queueDepth}
            </strong>
          </span>
        )}
      </div>
      <div className="c360-mb-3 c360-flex c360-flex-wrap c360-gap-2">
        <Badge color="gray" size="sm">
          Total {total}
        </Badge>
        <Badge color="warning" size="sm">
          Pending {pending}
        </Badge>
        <Badge color="primary" size="sm">
          Running {running}
        </Badge>
        <Badge color="info" size="sm">
          Paused {paused}
        </Badge>
        <Badge color="success" size="sm">
          Done {done}
        </Badge>
        <Badge color="danger" size="sm">
          Failed {failed}
        </Badge>
        <Badge color="gray" size="sm">
          Cancelled {cancelled}
        </Badge>
      </div>
      {stacked.length > 0 ? (
        <Progress label="Status mix" stacked={stacked} size="sm" />
      ) : (
        <p className="c360-m-0 c360-text-2xs c360-text-muted">
          No session metrics yet.
        </p>
      )}
    </Card>
  );
}

"use client";

import { useMemo, type ReactNode } from "react";
import { History } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { HiringSignalCharts } from "@/components/feature/hiring-signals/HiringSignalCharts";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

function runStatusBadgeColor(status: string): BadgeColor {
  const s = status.toUpperCase();
  if (s.includes("SUCCESS") || s === "SUCCEEDED" || s === "DONE")
    return "success";
  if (s.includes("RUNNING") || s.includes("PENDING")) return "warning";
  if (
    s.includes("FAIL") ||
    s.includes("ERROR") ||
    s.includes("TIME") ||
    s.includes("ABORT")
  )
    return "danger";
  return "gray";
}

export interface HiringSignalsDashboardProps {
  jobs: LinkedInJobRow[];
  loading: boolean;
  statsBar: ReactNode;
  /** Rendered directly under the stats bar (e.g. dashboard job globe). */
  belowStatsSlot?: ReactNode;
  /** When set, recent-job rows can open the company drawer. */
  onOpenCompanyDrawer?: (row: LinkedInJobRow) => void;
  /** First row from satellite runs payload (recent scrape run). */
  latestRun?: Record<string, unknown>;
  runsLoading?: boolean;
  onGoToRuns?: () => void;
  className?: string;
}

export function HiringSignalsDashboard({
  jobs,
  loading,
  statsBar,
  belowStatsSlot,
  onOpenCompanyDrawer,
  latestRun,
  runsLoading,
  onGoToRuns,
  className,
}: HiringSignalsDashboardProps) {
  const recent = useMemo(() => {
    const copy = [...jobs];
    copy.sort((a, b) => {
      const ta = new Date(a.postedAt).getTime();
      const tb = new Date(b.postedAt).getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    });
    return copy.slice(0, 10);
  }, [jobs]);

  const latestStatus = latestRun
    ? String(latestRun.status ?? latestRun.state ?? "—")
    : "";
  const latestRunning = /running|pending/i.test(latestStatus);
  const latestStarted = String(
    latestRun?.startedAt ?? latestRun?.started_at ?? "",
  );
  const latestItems = Number(
    latestRun?.itemCount ?? latestRun?.item_count ?? 0,
  );

  return (
    <div
      className={cn(
        "c360-flex c360-flex-col c360-gap-6 c360-hs-dashboard-wrapper",
        className,
      )}
    >
      {latestRun && Object.keys(latestRun).length > 0 ? (
        <Card
          className="c360-hs-dashboard-latest-run-card"
          title="Latest scrape run"
          subtitle="Most recent scrape session (scraper.server)"
        >
          <div className="c360-flex c360-flex-row c360-gap-3 c360-hs-latest-run-inner">
            <div className="c360-hs-latest-run-main">
              <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2">
                <Badge color={runStatusBadgeColor(latestStatus)} size="sm">
                  {latestStatus || "—"}
                </Badge>
                <span className="c360-text-2xs c360-text-ink-muted">
                  {latestItems > 0
                    ? `${latestItems.toLocaleString()} items`
                    : "Items —"}
                </span>
              </div>
              <p className="c360-m-0 c360-text-sm c360-text-ink">
                Started{" "}
                {latestStarted
                  ? formatRelativeTime(new Date(latestStarted))
                  : "—"}
              </p>
              {latestRunning ? (
                <Progress indeterminate size="sm" className="c360-max-w-md" />
              ) : null}
            </div>
            {onGoToRuns ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="c360-shrink-0 c360-gap-2"
                onClick={onGoToRuns}
                disabled={runsLoading}
                leftIcon={<History size={14} />}
              >
                Open Runs tab
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {statsBar}

      {belowStatsSlot}

      <HiringSignalCharts jobs={jobs} />

      <Card
        className="c360-dashboard-recent-activity-card"
        title="Recent activity"
        subtitle="Latest postings (visible list)"
      >
        {loading && jobs.length === 0 ? (
          <p className="c360-text-sm c360-text-muted">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="c360-text-sm c360-text-muted">No rows to show.</p>
        ) : (
          <ul
            className="c360-m-0 c360-list-none c360-space-y-2 c360-p-0 c360-hs-dashboard-recent-list"
            role="list"
          >
            {recent.map((j) => (
              <li
                key={j.id || `${j.linkedinJobId}-${j.apifyItemId}`}
                className="c360-rounded c360-border c360-border-ink-8 c360-hs-dashboard-recent-item c360-overflow-hidden"
              >
                {onOpenCompanyDrawer ? (
                  <button
                    type="button"
                    className={cn(
                      "c360-flex c360-w-full c360-items-start c360-justify-between c360-gap-2 c360-border-0 c360-bg-transparent c360-p-2 c360-text-left",
                      "hover:c360-bg-ink-4 focus-visible:c360-outline focus-visible:c360-outline-2 focus-visible:c360-outline-offset-[-2px]",
                    )}
                    onClick={() => onOpenCompanyDrawer(j)}
                  >
                    <div className="c360-min-w-0">
                      <p className="c360-m-0 c360-text-sm c360-font-medium c360-text-ink c360-hs-line-clamp-2">
                        {j.title}
                      </p>
                      <p className="c360-mt-0-5 c360-text-2xs c360-text-muted">
                        {j.companyName || "—"}
                        {j.location ? ` · ${j.location}` : ""}
                      </p>
                    </div>
                    <span className="c360-shrink-0 c360-text-2xs c360-text-muted">
                      {j.postedAt
                        ? formatRelativeTime(new Date(j.postedAt))
                        : "—"}
                    </span>
                  </button>
                ) : (
                  <div className="c360-flex c360-items-start c360-justify-between c360-gap-2 c360-p-2">
                    <div className="c360-min-w-0">
                      <p className="c360-m-0 c360-text-sm c360-font-medium c360-text-ink c360-hs-line-clamp-2">
                        {j.title}
                      </p>
                      <p className="c360-mt-0-5 c360-text-2xs c360-text-muted">
                        {j.companyName || "—"}
                        {j.location ? ` · ${j.location}` : ""}
                      </p>
                    </div>
                    <span className="c360-shrink-0 c360-text-2xs c360-text-muted">
                      {j.postedAt
                        ? formatRelativeTime(new Date(j.postedAt))
                        : "—"}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { Building2, History } from "lucide-react";
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
  if (s.includes("SUCCESS") || s === "SUCCEEDED") return "success";
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
  statsBar: React.ReactNode;
  onOpenCompanyDrawer: (row: LinkedInJobRow) => void;
  /** First row from satellite runs payload (recent Apify run). */
  latestRun?: Record<string, unknown>;
  runsLoading?: boolean;
  onGoToRuns?: () => void;
  className?: string;
}

export function HiringSignalsDashboard({
  jobs,
  loading,
  statsBar,
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

  const topCompanies = useMemo(() => {
    const map = new Map<
      string,
      { name: string; uuid: string; count: number; sample: LinkedInJobRow }
    >();
    for (const j of jobs) {
      const uuid = j.companyUuid?.trim();
      if (!uuid) continue;
      const cur = map.get(uuid);
      if (!cur) {
        map.set(uuid, { name: j.companyName, uuid, count: 1, sample: j });
      } else {
        cur.count += 1;
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 6);
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
    <div className={cn("c360-flex c360-flex-col c360-gap-6", className)}>
      {latestRun && Object.keys(latestRun).length > 0 ? (
        <Card
          title="Latest scrape run"
          subtitle="Most recent Apify run (job.server)"
        >
          <div className="c360-flex c360-flex-col c360-gap-3 sm:c360-flex-row sm:c360-items-start sm:c360-justify-between">
            <div className="c360-min-w-0 c360-space-y-2">
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

      <HiringSignalCharts jobs={jobs} />

      <div className="c360-2col-grid">
        <Card title="Recent activity" subtitle="Latest postings (visible list)">
          {loading && jobs.length === 0 ? (
            <p className="c360-text-sm c360-text-muted">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="c360-text-sm c360-text-muted">No rows to show.</p>
          ) : (
            <ul
              className="c360-m-0 c360-list-none c360-space-y-2 c360-p-0"
              role="list"
            >
              {recent.map((j) => (
                <li
                  key={j.id || `${j.linkedinJobId}-${j.apifyItemId}`}
                  className="c360-flex c360-items-start c360-justify-between c360-gap-2 c360-rounded c360-border c360-border-ink-8 c360-p-2"
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
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Top companies"
          subtitle="By open roles on this list (click to open panel)"
        >
          {topCompanies.length === 0 ? (
            <p className="c360-text-sm c360-text-muted">
              No company_uuid on visible rows — link jobs to Connectra first.
            </p>
          ) : (
            <ul
              className="c360-m-0 c360-list-none c360-space-y-2 c360-p-0"
              role="list"
            >
              {topCompanies.map((c) => (
                <li key={c.uuid}>
                  <button
                    type="button"
                    className="c360-flex c360-w-full c360-items-center c360-justify-between c360-gap-2 c360-rounded c360-border c360-border-ink-8 c360-bg-ink-1/30 c360-p-3 c360-text-left c360-hs-hover-primary-border"
                    onClick={() => onOpenCompanyDrawer(c.sample)}
                  >
                    <span className="c360-flex c360-min-w-0 c360-items-center c360-gap-2">
                      <Building2
                        size={18}
                        className="c360-shrink-0 c360-text-primary"
                        aria-hidden
                      />
                      <span className="c360-truncate c360-font-medium c360-text-ink">
                        {c.name || c.uuid}
                      </span>
                    </span>
                    <Badge color="info" size="sm">
                      {c.count}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

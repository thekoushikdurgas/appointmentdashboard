"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Activity,
  Calendar,
  BarChart2,
  TrendingUp,
  Database,
  Clock,
  PieChart,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { type CalendarEvent } from "@/components/shared/CalendarView";
import { jobsService } from "@/services/graphql/jobsService";
import { jobBucketCounts } from "@/lib/jobs/jobBucketCounts";
import type { Activity as ActivityRow } from "@/services/graphql/activitiesService";
import { useActivities } from "@/hooks/useActivities";
import {
  ActivityFeedTab,
  type FeedActivityItem,
} from "@/components/feature/activities/ActivityFeedTab";
import { ActivityCalendarTab } from "@/components/feature/activities/ActivityCalendarTab";
import {
  ActivityAnalyticsTab,
  JobStatsTab,
  type AnalyticsDataPoint,
  type JobStatPoint,
} from "@/components/feature/activities/ActivityAnalyticsTab";
import {
  ActivityFiltersBar,
  type ActivityFiltersBarValues,
} from "@/components/feature/activities/ActivityFiltersBar";
import { humanizeToken } from "@/lib/activityDisplay";
import { useUsage } from "@/hooks/useUsage";
import { useFeatureOverview } from "@/hooks/useFeatureOverview";
import { useRole } from "@/context/RoleContext";
import { FeatureUsageCard } from "@/components/feature/usage/FeatureUsageCard";
import { FeatureOverviewPanel } from "@/components/feature/usage/FeatureOverviewPanel";
import { cn, formatNumber } from "@/lib/utils";

const PAGE_SIZE = 20;

const EMPTY_FILTERS: ActivityFiltersBarValues = {
  serviceType: "",
  actionType: "",
  status: "",
  startDate: "",
  endDate: "",
};

const EMPTY_ANALYTICS: AnalyticsDataPoint[] = [];

const ACTIVITY_TABS = [
  "feed",
  "calendar",
  "analytics",
  "jobs",
  "usage",
] as const;
type ActivityTab = (typeof ACTIVITY_TABS)[number];

function firstOfNextMonthLabel(): string {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return next.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function localDateTimeToIso(local: string): string | undefined {
  const t = local.trim();
  if (!t) return undefined;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function buildActivityDescription(a: ActivityRow): string {
  const base = `${humanizeToken(a.serviceType)} · ${humanizeToken(a.actionType)}`;
  if (a.resultCount > 0) {
    return `${base} — ${a.resultCount} results`;
  }
  if (a.status === "failed" && a.errorMessage) {
    return `${base} — ${a.errorMessage}`;
  }
  return base;
}

function buildAnalyticsFromItems(items: ActivityRow[]): AnalyticsDataPoint[] {
  const buckets: Record<string, AnalyticsDataPoint> = {};
  for (const a of items) {
    const d = new Date(a.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (!buckets[d]) buckets[d] = { date: d, emails: 0, contacts: 0, jobs: 0 };
    const actionType = String(a.actionType ?? "").toLowerCase();
    const serviceType = String(a.serviceType ?? "").toLowerCase();
    if (
      serviceType.includes("email") ||
      actionType === "find" ||
      actionType === "verify"
    ) {
      buckets[d].emails++;
    } else if (
      serviceType.includes("contact") ||
      serviceType.includes("import") ||
      actionType === "create" ||
      actionType === "import"
    ) {
      buckets[d].contacts++;
    } else if (
      serviceType.includes("job") ||
      actionType === "export" ||
      actionType === "search" ||
      actionType === "query"
    ) {
      buckets[d].jobs++;
    }
  }
  return Object.values(buckets).slice(-7);
}

function successRatePercent(byStatus: unknown): number | null {
  if (!byStatus || typeof byStatus !== "object") return null;
  const o = byStatus as Record<string, unknown>;
  let success = 0;
  let sum = 0;
  for (const [k, v] of Object.entries(o)) {
    const n = typeof v === "number" ? v : Number(v) || 0;
    sum += n;
    if (k.toLowerCase() === "success") success += n;
  }
  if (sum === 0) return null;
  return Math.round((success / sum) * 100);
}

export default function ActivitiesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlTab = searchParams.get("tab");
  const initialTab: ActivityTab =
    urlTab && (ACTIVITY_TABS as readonly string[]).includes(urlTab)
      ? (urlTab as ActivityTab)
      : "feed";
  const [activeTab, setActiveTab] = useState<ActivityTab>(initialTab);
  const [filterForm, setFilterForm] =
    useState<ActivityFiltersBarValues>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [jobStats, setJobStats] = useState<JobStatPoint[]>([]);

  const { plan, credits, isSuperAdmin } = useRole();
  const {
    usageData,
    loading: usageLoading,
    error: usageError,
    refresh: refreshUsage,
    resetUsage,
  } = useUsage();
  const [usageSubTab, setUsageSubTab] = useState<"overview" | "drill-down">(
    "overview",
  );
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [resetProcessing, setResetProcessing] = useState(false);

  const { overview, loading: overviewLoading } = useFeatureOverview(
    activeTab === "usage" &&
      usageSubTab === "drill-down" &&
      selectedFeature?.trim()
      ? selectedFeature
      : null,
  );

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && (ACTIVITY_TABS as readonly string[]).includes(t)) {
      setActiveTab(t as ActivityTab);
    }
    const feat = searchParams.get("feature");
    if (feat) {
      setSelectedFeature(feat);
      setUsageSubTab("drill-down");
    }
  }, [searchParams]);

  const handleTabChange = useCallback(
    (v: string) => {
      const next = (ACTIVITY_TABS as readonly string[]).includes(v)
        ? (v as ActivityTab)
        : "feed";
      setActiveTab(next);
      const p = new URLSearchParams(searchParams.toString());
      if (next === "feed") p.delete("tab");
      else p.set("tab", next);
      if (next === "usage") {
        const feat = p.get("feature");
        if (feat) {
          setSelectedFeature(feat);
          setUsageSubTab("drill-down");
        } else {
          setSelectedFeature(null);
          setUsageSubTab("overview");
        }
      } else {
        p.delete("feature");
        setSelectedFeature(null);
        setUsageSubTab("overview");
      }
      const qs = p.toString();
      router.replace(qs ? `/activities?${qs}` : "/activities", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const handleDrillDown = useCallback(
    (feature: string) => {
      setSelectedFeature(feature);
      setUsageSubTab("drill-down");
      setActiveTab("usage");
      const p = new URLSearchParams(searchParams.toString());
      p.set("tab", "usage");
      p.set("feature", feature);
      router.replace(`/activities?${p.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleResetUsage = useCallback(
    async (feature: string) => {
      setResetProcessing(true);
      try {
        await resetUsage({ feature });
        await refreshUsage();
        toast.success(`Usage reset for ${feature}.`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Reset failed");
      } finally {
        setResetProcessing(false);
      }
    },
    [resetUsage, refreshUsage],
  );

  const startIso = localDateTimeToIso(filterForm.startDate);
  const endIso = localDateTimeToIso(filterForm.endDate);

  useEffect(() => {
    setPage(1);
  }, [
    filterForm.serviceType,
    filterForm.actionType,
    filterForm.status,
    filterForm.startDate,
    filterForm.endDate,
  ]);

  const {
    activities: actRows,
    total,
    stats,
    loading,
    error,
    hasNext,
    hasPrevious,
    refresh,
    offset: pageOffset,
  } = useActivities({
    serviceType: filterForm.serviceType || undefined,
    actionType: filterForm.actionType || undefined,
    status: filterForm.status || undefined,
    startDate: startIso,
    endDate: endIso,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const feedItems: FeedActivityItem[] = useMemo(
    () =>
      actRows.map((a) => ({
        id: String(a.id),
        serviceType: a.serviceType,
        actionType: a.actionType,
        status: a.status,
        description: buildActivityDescription(a),
        createdAt: a.createdAt,
        resultCount: a.resultCount,
        errorMessage: a.errorMessage ?? null,
      })),
    [actRows],
  );

  const calendarEvents: CalendarEvent[] = useMemo(
    () =>
      actRows.map((a) => ({
        id: String(a.id),
        title: `${a.serviceType}: ${a.actionType}`,
        start: a.createdAt,
        color:
          a.status === "failed"
            ? "var(--c360-danger)"
            : a.status === "success"
              ? "var(--c360-success)"
              : "var(--c360-primary)",
      })),
    [actRows],
  );

  const analyticsData = useMemo(
    () => (actRows.length ? buildAnalyticsFromItems(actRows) : EMPTY_ANALYTICS),
    [actRows],
  );

  useEffect(() => {
    if (activeTab !== "jobs") return;
    const poll = async () => {
      try {
        const data = await jobsService.list({ limit: 100 });
        const { running, completed, failed } = jobBucketCounts(data.jobs);
        setJobStats((prev) => [
          ...prev.slice(-19),
          {
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            running,
            completed,
            failed,
          },
        ]);
      } catch {
        // ignore polling errors
      }
    };
    poll();
    const timer = setInterval(poll, 10000);
    return () => clearInterval(timer);
  }, [activeTab]);

  const successRate = stats ? successRatePercent(stats.byStatus) : null;
  const displayTotal = stats?.totalActivities ?? total;
  const displayRecent = stats?.recentActivities;

  const statsRow = [
    {
      label: "Total (stats scope)",
      value: loading ? "…" : displayTotal,
      icon: <Database size={20} />,
      iconBg: "var(--c360-primary-light)",
      iconColor: "var(--c360-primary)",
    },
    {
      label: "Last 24h (API)",
      value:
        loading || displayRecent === undefined ? "…" : String(displayRecent),
      icon: <Clock size={20} />,
      iconBg: "rgba(43,193,85,0.12)",
      iconColor: "var(--c360-success)",
    },
    {
      label: "Success rate (stats)",
      value: loading || successRate === null ? "—" : `${successRate}%`,
      icon: <TrendingUp size={20} />,
      iconBg: "rgba(181,25,236,0.12)",
      iconColor: "var(--c360-accent)",
    },
  ];

  const rangeStart = total === 0 ? 0 : pageOffset + 1;
  const rangeEnd = pageOffset + actRows.length;

  return (
    <DashboardPageLayout>
      <PageHeader title="Activities" />

      {error && activeTab !== "usage" && (
        <p className="c360-input-error c360-mb-4" role="alert">
          {error}
        </p>
      )}

      {activeTab !== "usage" && (
        <>
          <ActivityFiltersBar
            values={filterForm}
            onChange={setFilterForm}
            onClear={() => setFilterForm({ ...EMPTY_FILTERS })}
            disabled={loading}
          />

          <div className="c360-flex c360-flex-wrap c360-justify-between c360-items-center c360-gap-3 c360-mb-4">
            <p className="c360-text-sm c360-text-muted c360-m-0">
              Showing{" "}
              <strong>
                {rangeStart}-{rangeEnd}
              </strong>{" "}
              of <strong>{total}</strong>
            </p>
            <div className="c360-flex c360-gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!hasPrevious || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!hasNext || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={loading}
                onClick={() => void refresh()}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="c360-dashboard-layout__stats c360-mb-6">
            {statsRow.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="c360-mb-4">
          <TabsList>
            <TabsTrigger value="feed" icon={<Activity size={14} />}>
              Activity Feed
            </TabsTrigger>
            <TabsTrigger value="calendar" icon={<Calendar size={14} />}>
              Calendar
            </TabsTrigger>
            <TabsTrigger value="analytics" icon={<BarChart2 size={14} />}>
              Analytics
            </TabsTrigger>
            <TabsTrigger value="jobs" icon={<TrendingUp size={14} />}>
              Live Job Stats
            </TabsTrigger>
            <TabsTrigger value="usage" icon={<PieChart size={14} />}>
              Usage
            </TabsTrigger>
          </TabsList>
        </div>

        {activeTab === "feed" && (
          <ActivityFeedTab activities={feedItems} loading={loading} />
        )}
        {activeTab === "calendar" && (
          <ActivityCalendarTab events={calendarEvents} />
        )}
        {activeTab === "analytics" && (
          <ActivityAnalyticsTab
            analyticsData={analyticsData}
            stats={stats}
            statsLoading={loading}
          />
        )}
        {activeTab === "jobs" && <JobStatsTab jobStats={jobStats} />}

        {activeTab === "usage" && (
          <div className="c360-section-stack">
            {usageError && (
              <Alert variant="danger" className="c360-mb-4">
                {usageError}
              </Alert>
            )}
            <div className="c360-flex c360-flex-wrap c360-gap-2 c360-mb-4 c360-items-center">
              <Button
                variant="secondary"
                size="sm"
                disabled={usageLoading}
                leftIcon={
                  <RefreshCw
                    size={14}
                    className={cn(usageLoading && "c360-spin")}
                  />
                }
                onClick={() => void refreshUsage()}
              >
                Refresh
              </Button>
              <Badge color="blue">{formatNumber(credits)} credits left</Badge>
            </div>

            <div className="c360-mb-4">
              <Tabs
                value={usageSubTab}
                onValueChange={(v) =>
                  setUsageSubTab(v as "overview" | "drill-down")
                }
                variant="filter"
              >
                <TabsList>
                  <TabsTrigger value="overview">All features</TabsTrigger>
                  <TabsTrigger value="drill-down">Feature detail</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {usageSubTab === "drill-down" && (
              <div className="c360-section-stack c360-mb-6">
                <Card
                  title="Pick a feature"
                  subtitle="Then open Usage, Activity, or Jobs sub-tabs below"
                >
                  <div className="c360-card-body">
                    <div className="c360-flex c360-flex-wrap c360-gap-2">
                      {usageData.map((f) => (
                        <button
                          key={f.feature}
                          type="button"
                          className={cn(
                            "c360-btn c360-btn--sm",
                            selectedFeature === f.feature
                              ? "c360-btn--primary"
                              : "c360-btn--secondary",
                          )}
                          onClick={() => {
                            setSelectedFeature(f.feature);
                            const p = new URLSearchParams(
                              searchParams.toString(),
                            );
                            p.set("tab", "usage");
                            p.set("feature", f.feature);
                            router.replace(`/activities?${p.toString()}`, {
                              scroll: false,
                            });
                          }}
                        >
                          {f.feature}
                        </button>
                      ))}
                    </div>
                    {!selectedFeature && usageData.length > 0 && (
                      <p className="c360-text-sm c360-text-muted c360-mt-3 c360-mb-0">
                        Select a feature to load overview data.
                      </p>
                    )}
                  </div>
                </Card>

                <FeatureOverviewPanel
                  overview={overview}
                  loading={overviewLoading}
                  showResetUsage={isSuperAdmin}
                  onResetUsage={handleResetUsage}
                  resetProcessing={resetProcessing}
                />
              </div>
            )}

            {usageSubTab === "overview" && (
              <div className="c360-usage-grid">
                {usageLoading && (
                  <p className="c360-page-subtitle">Loading usage…</p>
                )}
                {!usageLoading && usageData.length === 0 && !usageError && (
                  <p className="c360-page-subtitle">
                    No usage records from the gateway yet, or your plan has no
                    tracked features.
                  </p>
                )}
                {usageData.map((item) => (
                  <FeatureUsageCard
                    key={item.feature}
                    feature={item}
                    onDrillDown={handleDrillDown}
                  />
                ))}
              </div>
            )}

            <Card
              title="Billing cycle"
              subtitle="Usage periods follow gateway rules (often monthly)"
              padding="md"
              className="c360-mt-6"
            >
              <div className="c360-billing-info-row">
                <div>
                  <div className="c360-section-label">Current plan</div>
                  <div className="c360-billing-stat-value">
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </div>
                </div>
                <div>
                  <div className="c360-section-label">Credits remaining</div>
                  <div className="c360-billing-stat-value">
                    {formatNumber(credits)}
                  </div>
                </div>
                <div>
                  <div className="c360-section-label">Next period starts</div>
                  <div className="c360-billing-stat-value">
                    {firstOfNextMonthLabel()}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Tabs>
    </DashboardPageLayout>
  );
}

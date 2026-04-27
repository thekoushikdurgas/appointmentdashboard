"use client";

import { useEffect, useState } from "react";
import { Users, Mail, Briefcase, TrendingUp } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import {
  OnboardingTour,
  DEFAULT_TOUR_STEPS,
} from "@/components/shared/OnboardingTour";
import { contactsService } from "@/services/graphql/contactsService";
import { jobsService } from "@/services/graphql/jobsService";
import {
  activitiesService,
  type Activity as ActivityRecord,
} from "@/services/graphql/activitiesService";
import {
  analyticsService,
  type PerformanceMetricRow,
} from "@/services/graphql/analyticsService";
import { usePerformanceMetric } from "@/hooks/usePerformanceMetric";
import { DashboardAdCarousel } from "@/components/feature/dashboard/DashboardAdCarousel";
import {
  DashboardStatRow,
  type StatCardData,
} from "@/components/feature/dashboard/DashboardStatRow";
import {
  DashboardChartSection,
  type AreaDataPoint,
} from "@/components/feature/dashboard/DashboardChartSection";
import type { ActivityItem } from "@/components/feature/dashboard/DashboardActivityFeed";

/** Build 10-bucket sparkline from activity timestamps over the last 7 days */
function buildSparkFromActivities(
  items: ActivityRecord[],
  buckets = 10,
  filterFn?: (a: ActivityRecord) => boolean,
): Array<{ value: number }> {
  const now = Date.now();
  const windowMs = 7 * 24 * 60 * 60 * 1000;
  const bucketMs = windowMs / buckets;
  const counts = Array(buckets).fill(0) as number[];
  const filtered = filterFn ? items.filter(filterFn) : items;
  for (const item of filtered) {
    const age = now - new Date(item.createdAt).getTime();
    if (age < 0 || age > windowMs) continue;
    const idx = Math.floor(age / bucketMs);
    if (idx >= 0 && idx < buckets) counts[buckets - 1 - idx]++;
  }
  return counts.map((v) => ({ value: v }));
}

/** Build area chart data from analytics performance metrics */
function buildAreaDataFromMetrics(
  metrics: PerformanceMetricRow[],
): AreaDataPoint[] {
  const buckets: Record<string, { contacts: number; emails: number }> = {};
  for (const m of metrics) {
    const date = new Date(m.timestamp ?? m.createdAt);
    const key = date.toLocaleString([], { hour: "2-digit", minute: "2-digit" });
    if (!buckets[key]) buckets[key] = { contacts: 0, emails: 0 };
    if (m.metricName?.toLowerCase().includes("contact")) {
      buckets[key].contacts += m.metricValue;
    } else {
      buckets[key].emails += m.metricValue;
    }
  }
  const entries = Object.entries(buckets).slice(-12);
  if (entries.length === 0) return [];
  return entries.map(([time, vals]) => ({ time, ...vals }));
}

export default function DashboardPage() {
  const { user } = useAuth();
  // Record dashboard page-view performance metric (fire-and-forget)
  usePerformanceMetric("dashboard_view", undefined, { page: "dashboard" });

  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<StatCardData[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [liveData, setLiveData] = useState<AreaDataPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    (async () => {
      try {
        const [contacts, jobs, acts, metrics] = await Promise.allSettled([
          contactsService.list({ limit: 1, offset: 0 }),
          jobsService.list({ limit: 80 }),
          activitiesService.list({ limit: 50, offset: 0 }),
          analyticsService.listPerformanceMetrics({ limit: 50 }),
        ]);
        if (cancelled) return;

        const contactsCount =
          contacts.status === "fulfilled" ? contacts.value.total : 0;
        const jobsList = jobs.status === "fulfilled" ? jobs.value.jobs : [];
        const jobsTotal =
          jobs.status === "fulfilled" ? jobs.value.pageInfo.total : 0;
        const running = jobsList.filter((j) =>
          ["running", "queued", "pending"].includes(
            String(j.status).toLowerCase(),
          ),
        ).length;
        const creditsLeft = user?.credits_remaining ?? 0;
        const actItems =
          acts.status === "fulfilled"
            ? acts.value.activities.activities.items
            : [];

        const allSpark = buildSparkFromActivities(actItems);
        const emailSpark = buildSparkFromActivities(
          actItems,
          10,
          (a) => a.serviceType?.toLowerCase().includes("email") ?? false,
        );
        const jobSpark = buildSparkFromActivities(
          actItems,
          10,
          (a) =>
            (a.actionType?.toLowerCase().includes("job") ?? false) ||
            (a.serviceType?.toLowerCase().includes("job") ?? false),
        );
        const creditSpark = buildSparkFromActivities(
          actItems,
          10,
          (a) => a.actionType?.toLowerCase().includes("find") ?? false,
        );

        setStats([
          {
            label: "Total Contacts",
            value: contactsCount,
            trend: 0,
            icon: <Users size={22} />,
            iconBg: "var(--c360-primary-light)",
            iconColor: "var(--c360-primary)",
            sparkData: allSpark,
            sparkColor: "var(--c360-primary)",
          },
          {
            label: "Pipeline (jobs)",
            value: jobsTotal,
            trend: 0,
            icon: <Mail size={22} />,
            iconBg: "rgba(43,193,85,0.12)",
            iconColor: "var(--c360-success)",
            sparkData: emailSpark,
            sparkColor: "var(--c360-success)",
          },
          {
            label: "Active Jobs",
            value: running,
            trend: 0,
            icon: <Briefcase size={22} />,
            iconBg: "rgba(255,109,77,0.12)",
            iconColor: "var(--c360-warning)",
            sparkData: jobSpark,
            sparkColor: "var(--c360-warning)",
          },
          {
            label: "Credits remaining",
            value: creditsLeft,
            trend: 0,
            icon: <TrendingUp size={22} />,
            iconBg: "rgba(181,25,236,0.12)",
            iconColor: "var(--c360-accent)",
            sparkData: creditSpark,
            sparkColor: "var(--c360-accent)",
          },
        ]);

        setActivity(
          actItems.slice(0, 8).map((a) => ({
            id: a.id,
            text: `${a.serviceType} · ${a.actionType} · ${a.status}`,
            time: a.createdAt,
            type:
              a.status === "failed" ? ("info" as const) : ("success" as const),
          })),
        );

        if (metrics.status === "fulfilled" && metrics.value.length > 0) {
          const built = buildAreaDataFromMetrics(metrics.value);
          if (built.length > 0) setLiveData(built);
        }
      } catch {
        // keep empty arrays
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.credits_remaining]);

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  return (
    <DashboardPageLayout>
      <OnboardingTour steps={DEFAULT_TOUR_STEPS} />
      <div className="c360-page-header">
        <div>
          <h1 className="c360-page-header__title">
            {greeting}, {user?.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="c360-page-header__subtitle">
            Here&apos;s what&apos;s happening with your account today
          </p>
        </div>
        <Badge color="green" dot>
          Live
        </Badge>
      </div>

      <DashboardAdCarousel interval={6000} />

      <DashboardStatRow stats={stats} loading={statsLoading} />

      <DashboardChartSection liveData={liveData} activity={activity} />
    </DashboardPageLayout>
  );
}

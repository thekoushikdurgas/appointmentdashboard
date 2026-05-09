"use client";

import { useEffect, useState } from "react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import {
  OnboardingTour,
  DEFAULT_TOUR_STEPS,
} from "@/components/shared/OnboardingTour";
import { activitiesService } from "@/services/graphql/activitiesService";
import {
  analyticsService,
  type PerformanceMetricRow,
} from "@/services/graphql/analyticsService";
import { usePerformanceMetric } from "@/hooks/usePerformanceMetric";
import { useRole } from "@/context/RoleContext";
import { DashboardAdCarousel } from "@/components/feature/dashboard/DashboardAdCarousel";
import { HiringSignalsHomeOverview } from "@/components/feature/hiring-signals/HiringSignalsHomeOverview";
import {
  DashboardChartSection,
  type AreaDataPoint,
} from "@/components/feature/dashboard/DashboardChartSection";
import type { ActivityItem } from "@/components/feature/dashboard/DashboardActivityFeed";

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
  const { isAdmin, isPro } = useRole();
  // Record dashboard page-view performance metric (fire-and-forget)
  usePerformanceMetric("dashboard_view", undefined, { page: "dashboard" });

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [liveData, setLiveData] = useState<AreaDataPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [acts, metrics] = await Promise.allSettled([
          activitiesService.list({ limit: 50, offset: 0 }),
          analyticsService.listPerformanceMetrics({ limit: 50 }),
        ]);
        if (cancelled) return;

        const actItems =
          acts.status === "fulfilled"
            ? acts.value.activities.activities.items
            : [];

        setActivity(
          actItems.slice(0, 5).map((a) => ({
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
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardPageLayout>
      <OnboardingTour steps={DEFAULT_TOUR_STEPS} />

      <DashboardAdCarousel interval={6000} />

      {isPro() || isAdmin ? (
        <section aria-label="Hiring signals overview">
          <HiringSignalsHomeOverview />
        </section>
      ) : null}

      <DashboardChartSection liveData={liveData} activity={activity} />
    </DashboardPageLayout>
  );
}

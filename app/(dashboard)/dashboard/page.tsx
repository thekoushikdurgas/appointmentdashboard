"use client";

import { useEffect, useState } from "react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import {
  OnboardingTour,
  DEFAULT_TOUR_STEPS,
} from "@/components/shared/OnboardingTour";
import { activitiesService } from "@/services/graphql/activitiesService";
import { usePerformanceMetric } from "@/hooks/usePerformanceMetric";
import { useRole } from "@/context/RoleContext";
import { DashboardAdCarousel } from "@/components/feature/dashboard/DashboardAdCarousel";
import { HiringSignalsHomeOverview } from "@/components/feature/hiring-signals/HiringSignalsHomeOverview";
import { DashboardChartSection } from "@/components/feature/dashboard/DashboardChartSection";
import type { ActivityItem } from "@/components/feature/dashboard/DashboardActivityFeed";
import { useHiringSignals } from "@/hooks/useHiringSignals";
import { HIRE_SIGNAL_ANALYTICS_FETCH_LIMIT } from "@/services/graphql/hiringSignalService";

export default function DashboardPage() {
  const { isAdmin, isPro } = useRole();
  const hiringEnabled = isPro() || isAdmin;

  const hiring = useHiringSignals(
    hiringEnabled ? { limit: HIRE_SIGNAL_ANALYTICS_FETCH_LIMIT } : {},
    {
      signalTimePreset: "all",
      fetchFullMatchPages: true,
      enabled: hiringEnabled,
    },
  );

  // Record dashboard page-view performance metric (fire-and-forget)
  usePerformanceMetric("dashboard_view", undefined, { page: "dashboard" });

  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const acts = await activitiesService.list({ limit: 50, offset: 0 });
        if (cancelled) return;

        const actItems = acts.activities.activities.items;

        setActivity(
          actItems.slice(0, 5).map((a) => ({
            id: a.id,
            text: `${a.serviceType} · ${a.actionType} · ${a.status}`,
            time: a.createdAt,
            type:
              a.status === "failed" ? ("info" as const) : ("success" as const),
          })),
        );
      } catch {
        /* keep empty */
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <DashboardPageLayout>
      <OnboardingTour steps={DEFAULT_TOUR_STEPS} />

      <DashboardAdCarousel interval={6000} />

      {hiringEnabled ? (
        <section aria-label="Hiring signals overview">
          <HiringSignalsHomeOverview hiring={hiring} />
        </section>
      ) : null}

      <DashboardChartSection
        activity={activity}
        jobs={hiringEnabled ? hiring.jobs : undefined}
        jobsLoading={hiringEnabled ? hiring.loading : false}
      />
    </DashboardPageLayout>
  );
}

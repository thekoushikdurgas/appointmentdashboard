"use client";

import Link from "next/link";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/lib/routes";
import { useRole } from "@/context/RoleContext";
import { useHiringSignals } from "@/hooks/useHiringSignals";
import { HIRE_SIGNAL_ANALYTICS_FETCH_LIMIT } from "@/services/graphql/hiringSignalService";
import { HireSignalFilterProvider } from "@/context/HireSignalFilterContext";
import { MarketInsightsPage } from "@/components/feature/market-insights/MarketInsightsPage";

export default function MarketInsightsRoutePage() {
  const { isPro, isAdmin } = useRole();
  const hiring = useHiringSignals(
    { limit: HIRE_SIGNAL_ANALYTICS_FETCH_LIMIT },
    { signalTimePreset: "all", fetchFullMatchPages: true },
  );

  if (!(isPro() || isAdmin)) {
    return (
      <DashboardPageLayout>
        <Card title="Professional feature">
          <p className="c360-text-sm c360-mb-4">
            Market Insights is available on Professional plans and for admins.
          </p>
          <Link href={ROUTES.BILLING} className="c360-btn c360-btn--primary">
            View plans
          </Link>
        </Card>
      </DashboardPageLayout>
    );
  }

  return (
    <HireSignalFilterProvider setFilters={hiring.setFilters}>
      <MarketInsightsPage hiring={hiring} signalTimePreset="all" />
    </HireSignalFilterProvider>
  );
}

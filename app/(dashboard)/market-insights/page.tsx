"use client";

import { useRole } from "@/context/RoleContext";
import { useHiringSignals } from "@/hooks/useHiringSignals";
import { HIRE_SIGNAL_ANALYTICS_FETCH_LIMIT } from "@/services/graphql/hiringSignalService";
import { HireSignalFilterProvider } from "@/context/HireSignalFilterContext";
import { MarketInsightsPage } from "@/components/feature/market-insights/MarketInsightsPage";
import { ProfessionalFeatureGate } from "@/components/shared/ProfessionalFeatureGate";

export default function MarketInsightsRoutePage() {
  const { isPro, isAdmin } = useRole();
  const hiring = useHiringSignals(
    { limit: HIRE_SIGNAL_ANALYTICS_FETCH_LIMIT },
    { signalTimePreset: "all", fetchFullMatchPages: true },
  );

  if (!(isPro() || isAdmin)) {
    return <ProfessionalFeatureGate featureName="Market Insights" />;
  }

  return (
    <HireSignalFilterProvider setFilters={hiring.setFilters}>
      <MarketInsightsPage hiring={hiring} signalTimePreset="all" />
    </HireSignalFilterProvider>
  );
}

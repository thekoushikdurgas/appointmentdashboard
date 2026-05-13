"use client";

import { useRole } from "@/context/RoleContext";
import { useHiringSignals } from "@/hooks/useHiringSignals";
import { HIRE_SIGNAL_ANALYTICS_FETCH_LIMIT } from "@/services/graphql/hiringSignalService";
import { HireSignalFilterProvider } from "@/context/HireSignalFilterContext";
import { DemandsTrendsPage } from "@/components/feature/demands/DemandsTrendsPage";
import { ProfessionalFeatureGate } from "@/components/shared/ProfessionalFeatureGate";

export default function DemandsAndTrendsPage() {
  const { isPro, isAdmin } = useRole();
  const hiring = useHiringSignals(
    { limit: HIRE_SIGNAL_ANALYTICS_FETCH_LIMIT },
    { signalTimePreset: "all", fetchFullMatchPages: true },
  );

  if (!(isPro() || isAdmin)) {
    return <ProfessionalFeatureGate featureName="Demands & Trends" />;
  }

  return (
    <HireSignalFilterProvider setFilters={hiring.setFilters}>
      <DemandsTrendsPage hiring={hiring} signalTimePreset="all" />
    </HireSignalFilterProvider>
  );
}

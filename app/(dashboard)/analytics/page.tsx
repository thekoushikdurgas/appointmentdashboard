"use client";

import { useState } from "react";
import { BarChart3, Gauge } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { AnalyticsUsageTab } from "@/components/feature/analytics/AnalyticsUsageTab";
import { AnalyticsPerformancePanel } from "@/components/feature/analytics/AnalyticsPerformancePanel";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";

type AnalyticsTab = "performance" | "usage";

const TABS: Array<{ id: AnalyticsTab; label: string; icon: React.ReactNode }> =
  [
    {
      id: "performance",
      label: "Performance (RUM)",
      icon: <Gauge size={16} />,
    },
    { id: "usage", label: "Product usage", icon: <BarChart3 size={16} /> },
  ];

export default function AnalyticsPage() {
  const [tab, setTab] = useState<AnalyticsTab>("performance");

  return (
    <DashboardPageLayout>
      <div className="c360-p-6">
        <div className="c360-page-header c360-mb-6">
          <div>
            <h1 className="c360-page-title">Analytics</h1>
            <p className="c360-page-subtitle">
              Core Web Vitals and real-user metrics from your sessions
            </p>
          </div>
        </div>

        <Alert variant="info" className="c360-mb-4">
          Lead scoring and predictive charts are not wired to a dedicated
          gateway field yet; this page focuses on RUM and product usage only.
        </Alert>

        <div className="c360-tabs c360-mb-4">
          <div
            className="c360-tabs__list"
            role="tablist"
            aria-label="Analytics sections"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id ? "true" : "false"}
                className={cn(
                  "c360-tabs__tab",
                  tab === t.id && "c360-tabs__tab--active",
                )}
                onClick={() => setTab(t.id)}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "usage" ? (
          <AnalyticsUsageTab />
        ) : (
          <AnalyticsPerformancePanel />
        )}
      </div>
    </DashboardPageLayout>
  );
}

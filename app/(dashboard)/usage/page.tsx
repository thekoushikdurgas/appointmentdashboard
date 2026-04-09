"use client";

import { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useRole } from "@/context/RoleContext";
import { cn, formatNumber } from "@/lib/utils";
import { useUsage } from "@/hooks/useUsage";
import { useFeatureOverview } from "@/hooks/useFeatureOverview";
import { FeatureUsageCard } from "@/components/feature/usage/FeatureUsageCard";
import { FeatureOverviewPanel } from "@/components/feature/usage/FeatureOverviewPanel";

function firstOfNextMonthLabel(): string {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return next.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function UsagePage() {
  const { plan, credits } = useRole();
  const { usageData, loading, error, refresh } = useUsage();
  const [activeTab, setActiveTab] = useState<"overview" | "drill-down">(
    "overview",
  );
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const { overview, loading: overviewLoading } = useFeatureOverview(
    activeTab === "drill-down" ? selectedFeature : null,
  );

  const handleDrillDown = useCallback((feature: string) => {
    setSelectedFeature(feature);
    setActiveTab("drill-down");
  }, []);

  return (
    <DashboardPageLayout>
      <div className="c360-page-header">
        <div>
          <h1 className="c360-page-header__title">Usage</h1>
          <p className="c360-page-header__subtitle">
            Feature limits, activity, and jobs (from the gateway usage module)
          </p>
        </div>
        <div className="c360-badge-row">
          <Button
            variant="secondary"
            size="sm"
            disabled={loading}
            leftIcon={
              <RefreshCw size={14} className={cn(loading && "c360-spin")} />
            }
            onClick={() => void refresh()}
          >
            Refresh
          </Button>
          <Badge color="blue">{formatNumber(credits)} credits left</Badge>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="c360-mb-4">
          {error}
        </Alert>
      )}

      <div className="c360-mb-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "overview" | "drill-down")}
          variant="filter"
        >
          <TabsList>
            <TabsTrigger value="overview">All features</TabsTrigger>
            <TabsTrigger value="drill-down">Feature detail</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "drill-down" && (
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
                    onClick={() => setSelectedFeature(f.feature)}
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

          <FeatureOverviewPanel overview={overview} loading={overviewLoading} />
        </div>
      )}

      {activeTab === "overview" && (
        <div className="c360-usage-grid">
          {loading && <p className="c360-page-subtitle">Loading usage…</p>}
          {!loading && usageData.length === 0 && !error && (
            <p className="c360-page-subtitle">
              No usage records from the gateway yet, or your plan has no tracked
              features.
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
    </DashboardPageLayout>
  );
}

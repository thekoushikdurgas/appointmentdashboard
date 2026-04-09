"use client";

import { XCircle, RefreshCw } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/shared/Skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useHealthStatus, type HealthStatusTab } from "@/hooks/useHealthStatus";
import { StatusOverviewTab } from "@/components/feature/status/StatusOverviewTab";
import { StatusConnectraTab } from "@/components/feature/status/StatusConnectraTab";
import { StatusEnvelopeReferenceTab } from "@/components/feature/status/StatusEnvelopeReferenceTab";
import { cn } from "@/lib/utils";

export default function StatusPage() {
  const { tab, setTab, overview, connectra, refreshCurrent, refreshing } =
    useHealthStatus();

  return (
    <DashboardPageLayout>
      <div className="c360-page-header">
        <div>
          <h1 className="c360-page-header__title">System status</h1>
          <p className="c360-page-header__subtitle">
            Gateway health (public), Connectra / VQL (signed in), and HTTP
            envelope reference (static). Operations tooling is in Django admin.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={
            <RefreshCw size={15} className={cn(refreshing && "c360-spin")} />
          }
          onClick={refreshCurrent}
          disabled={refreshing}
        >
          Refresh
        </Button>
      </div>

      <div className="c360-mb-4">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as HealthStatusTab)}
          variant="filter"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="connectra">Connectra</TabsTrigger>
            <TabsTrigger value="reference">Reference</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tab === "overview" && (
        <>
          {overview.error && (
            <Card className="c360-mb-4">
              <div className="c360-empty-state">
                <XCircle
                  size={36}
                  className="c360-text-danger c360-opacity-60"
                />
                <p className="c360-empty-state__title">API unreachable</p>
                <p className="c360-empty-state__desc">{overview.error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void overview.refresh()}
                >
                  Try again
                </Button>
              </div>
            </Card>
          )}
          {overview.loading && !overview.data ? (
            <div className="c360-section-stack">
              <Skeleton className="c360-rounded-lg" height={80} />
              <Skeleton className="c360-rounded-lg" height={300} />
            </div>
          ) : overview.data ? (
            <StatusOverviewTab health={overview.data} />
          ) : null}
        </>
      )}

      {tab === "connectra" && (
        <StatusConnectraTab
          data={connectra.data}
          loading={connectra.loading}
          error={connectra.error}
        />
      )}

      {tab === "reference" && <StatusEnvelopeReferenceTab />}
    </DashboardPageLayout>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ROUTES } from "@/lib/routes";

/**
 * Placeholder: gateway exposes only `campaignSatellite.campaigns` JSON — no
 * `getCampaign(id)` yet. Use list metrics or REST when available.
 */
export default function CampaignDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  return (
    <DashboardPageLayout>
      <div className="c360-p-6 c360-mx-auto c360-max-w-720">
        <div className="c360-mb-4">
          <Link href={ROUTES.CAMPAIGNS}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={15} />
              Back to campaigns
            </Button>
          </Link>
        </div>

        <h1 className="c360-page-title">Campaign</h1>
        <p className="c360-page-subtitle c360-mb-4">
          ID: <code className="c360-mono">{id}</code>
        </p>

        <Alert variant="info">
          Full campaign detail (recipients, stats, timeline) is not exposed on
          the GraphQL gateway yet — only the satellite JSON list. Use the
          campaigns table for summary metrics or the campaign service REST API
          when wired.
        </Alert>

        <Card title="Next steps" className="c360-mt-4">
          <p className="c360-page-subtitle c360-m-0">
            When <code className="c360-mono">getCampaign</code> / mutations ship
            (see backend 22_CAMPAIGNS_MODULE), this route can load live data.
          </p>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}

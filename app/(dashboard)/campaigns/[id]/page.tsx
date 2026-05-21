"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Play,
  Pause,
  Trash2,
  BarChart2,
  RefreshCw,
  Users,
  Send,
  Eye,
  MousePointerClick,
} from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { DataState } from "@/components/shared/DataState";
import { cn, formatRelativeTime } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import {
  campaignSatelliteService,
  parseCampaigns,
} from "@/services/graphql/campaignSatelliteService";
import { campaignsService } from "@/services/graphql/campaignsService";
import {
  mapCampaignSatelliteToListRow,
  type CampaignListRow,
  type CampaignListStatus,
} from "@/lib/campaignListMapping";
import { isCampaignSatelliteUnavailableMessage } from "@/lib/campaignSatelliteErrors";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const STATUS_COLOR: Record<
  CampaignListStatus,
  "success" | "danger" | "warning" | "primary" | "secondary"
> = {
  draft: "secondary",
  active: "success",
  paused: "warning",
  completed: "primary",
  failed: "danger",
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <div className="c360-stat-card">
      <div className="c360-stat-card__icon">{icon}</div>
      <div>
        <div className="c360-stat-card__value">{value}</div>
        <div className="c360-stat-card__label">{label}</div>
        {sub && <div className="c360-text-xs c360-text-muted">{sub}</div>}
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = decodeURIComponent(String(params.id ?? ""));

  const [campaign, setCampaign] = useState<CampaignListRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    try {
      const d = await campaignSatelliteService.listCampaigns();
      const parsed = parseCampaigns(d.campaignSatellite.campaigns);
      const rows = parsed.map((row, i) =>
        mapCampaignSatelliteToListRow(row, i),
      );
      const found = rows.find((r) => r.id === id) ?? null;
      setCampaign(found);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isCampaignSatelliteUnavailableMessage(msg)) {
        setNotConfigured(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAction = async (action: "pause" | "resume" | "delete") => {
    if (!campaign) return;
    setActionLoading(action);
    try {
      if (action === "pause") await campaignsService.pauseCampaign(campaign.id);
      else if (action === "resume")
        await campaignsService.resumeCampaign(campaign.id);
      else {
        await campaignsService.deleteCampaign(campaign.id);
        toast.success("Campaign deleted.");
        router.push(ROUTES.CAMPAIGNS);
        return;
      }
      toast.success(`Campaign ${action}d.`);
      void load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to ${action} campaign.`,
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openRate =
    campaign && campaign.sent > 0
      ? ((campaign.opened / campaign.sent) * 100).toFixed(1) + "%"
      : "—";

  const clickRate =
    campaign && campaign.opened > 0
      ? ((campaign.clicked / campaign.opened) * 100).toFixed(1) + "%"
      : "—";

  return (
    <DashboardPageLayout>
      <div className="c360-p-6">
        <div className="c360-page-header">
          <div className="c360-standalone-header c360-mb-0">
            <Link
              href={ROUTES.CAMPAIGNS}
              className="c360-back-link c360-flex c360-items-center c360-gap-1 c360-text-sm c360-text-muted c360-mb-2"
            >
              <ArrowLeft size={14} /> Back to Campaigns
            </Link>
            <h1 className="c360-standalone-header__title c360-flex c360-items-center c360-gap-2">
              <Mail size={20} />
              {campaign?.name ?? id}
            </h1>
            {campaign && (
              <p className="c360-standalone-header__subtitle">
                Created {formatRelativeTime(campaign.createdAt)}
              </p>
            )}
          </div>
          <div className="c360-badge-row">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw size={14} className={cn(loading && "c360-spin")} />
              Refresh
            </Button>
            {campaign?.status === "active" && (
              <Button
                variant="outline"
                size="sm"
                loading={actionLoading === "pause"}
                onClick={() => void handleAction("pause")}
              >
                <Pause size={14} /> Pause
              </Button>
            )}
            {campaign?.status === "paused" && (
              <Button
                variant="outline"
                size="sm"
                loading={actionLoading === "resume"}
                onClick={() => void handleAction("resume")}
              >
                <Play size={14} /> Resume
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              loading={actionLoading === "delete"}
              onClick={() => void handleAction("delete")}
            >
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="c360-mb-4">
            {error}
          </Alert>
        )}

        {notConfigured && (
          <Alert variant="warning" className="c360-mb-4">
            Campaign satellite is not configured (
            <code className="c360-mono">CAMPAIGN_API_URL</code> missing).
          </Alert>
        )}

        {loading && <DataState loading skeletonRows={3} />}

        {!loading && !campaign && !error && !notConfigured && (
          <Alert variant="warning">
            Campaign <code className="c360-mono">{id}</code> was not found.{" "}
            <Link href={ROUTES.CAMPAIGNS}>Back to list</Link>
          </Alert>
        )}

        {!loading && campaign && (
          <>
            <div className="c360-flex c360-items-center c360-gap-2 c360-mb-4">
              <Badge color={STATUS_COLOR[campaign.status]}>
                {campaign.status}
              </Badge>
            </div>

            <div className="c360-stats-grid c360-mb-6">
              <StatCard
                icon={<Users size={18} />}
                label="Recipients"
                value={campaign.recipients.toLocaleString()}
              />
              <StatCard
                icon={<Send size={18} />}
                label="Sent"
                value={campaign.sent.toLocaleString()}
              />
              <StatCard
                icon={<Eye size={18} />}
                label="Opened"
                value={campaign.opened.toLocaleString()}
                sub={`Open rate: ${openRate}`}
              />
              <StatCard
                icon={<MousePointerClick size={18} />}
                label="Clicked"
                value={campaign.clicked.toLocaleString()}
                sub={`Click rate: ${clickRate}`}
              />
            </div>

            <Card
              title="Analytics"
              subtitle="Detailed analytics coming once the campaign satellite exposes per-campaign stats."
              actions={<BarChart2 size={16} className="c360-text-muted" />}
            >
              <div className="c360-empty-state c360-p-8 c360-text-center c360-text-muted">
                <BarChart2
                  size={32}
                  className="c360-mx-auto c360-mb-2 c360-opacity-30"
                />
                <p>
                  Per-campaign analytics will appear here when the campaign
                  satellite publishes the <code>/campaigns/{"{id}"}/stats</code>{" "}
                  endpoint.
                </p>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardPageLayout>
  );
}

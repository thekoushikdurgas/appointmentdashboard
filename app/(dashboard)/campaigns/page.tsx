"use client";

import {
  Plus,
  Mail,
  Play,
  Pause,
  BarChart2,
  Trash2,
  Eye,
  Star,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { SearchBar } from "@/components/patterns/SearchBar";
import { Pagination } from "@/components/patterns/Pagination";
import { ReviewList } from "@/components/shared/ReviewList";
import { DataState } from "@/components/shared/DataState";
import { cn, formatRelativeTime } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { FEATURE_GATES } from "@/lib/featureAccess";
import { useRole } from "@/context/RoleContext";
import { useCampaignsList } from "@/hooks/useCampaignsList";
import { useState } from "react";
import type { CampaignListStatus } from "@/lib/campaignListMapping";
import { campaignsService } from "@/services/graphql/campaignsService";
import { toast } from "sonner";
import { CqlPlaygroundCard } from "@/components/feature/campaigns/CqlPlaygroundCard";

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

export default function CampaignsPage() {
  const { checkAccess } = useRole();
  const canAccess = checkAccess("campaigns");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { campaigns, loading, error, notConfigured, refresh } =
    useCampaignsList();

  const handleAction = async (
    id: string,
    action: "pause" | "resume" | "delete",
  ) => {
    setActionLoading(`${action}-${id}`);
    try {
      if (action === "pause") await campaignsService.pauseCampaign(id);
      else if (action === "resume") await campaignsService.resumeCampaign(id);
      else await campaignsService.deleteCampaign(id);
      toast.success(
        action === "delete" ? "Campaign deleted." : `Campaign ${action}d.`,
      );
      void refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to ${action} campaign.`,
      );
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openRate = (c: (typeof campaigns)[0]) =>
    c.sent > 0 ? ((c.opened / c.sent) * 100).toFixed(1) + "%" : "—";

  const clickRate = (c: (typeof campaigns)[0]) =>
    c.opened > 0 ? ((c.clicked / c.opened) * 100).toFixed(1) + "%" : "—";

  if (!canAccess) {
    return (
      <DashboardPageLayout>
        <div className="c360-p-6">
          <h1 className="c360-standalone-header__title">Campaigns</h1>
          <Alert variant="warning" className="c360-mt-4">
            {FEATURE_GATES.campaigns.label} is available on{" "}
            <strong>Professional</strong> and <strong>Enterprise</strong> plans.{" "}
            <Link href={ROUTES.BILLING}>View billing</Link> to upgrade.
          </Alert>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout>
      <div className="c360-p-6">
        <div className="c360-page-header">
          <div className="c360-standalone-header c360-mb-0">
            <h1 className="c360-standalone-header__title">Campaigns</h1>
            <p className="c360-standalone-header__subtitle">
              Email campaigns from the satellite service
            </p>
          </div>
          <div className="c360-badge-row">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCw size={14} className={cn(loading && "c360-spin")} />
              Refresh
            </Button>
            <Link href={ROUTES.CAMPAIGNS_TEMPLATES}>
              <Button variant="outline" size="sm" type="button">
                Templates
              </Button>
            </Link>
            <Link href={ROUTES.CAMPAIGNS_SEQUENCES}>
              <Button variant="outline" size="sm" type="button">
                Sequences
              </Button>
            </Link>
            <Link href={ROUTES.CAMPAIGNS_NEW}>
              <Button variant="primary" size="sm" type="button">
                <Plus size={15} />
                New Campaign
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="c360-mb-4">
            {error}
          </Alert>
        )}

        {notConfigured && (
          <Alert variant="warning" className="c360-mb-4">
            Campaign satellite is not configured on the API (
            <code className="c360-mono">CAMPAIGN_API_URL</code>). Lists will
            stay empty until the service is connected.
          </Alert>
        )}

        {loading && <DataState loading skeletonRows={4} />}

        {!loading && (
          <Card>
            <div className="c360-card-search-header">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search campaigns…"
              />
            </div>

            <div className="c360-table-wrapper">
              <table className="c360-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th className="c360-text-right">Recipients</th>
                    <th className="c360-text-right">Sent</th>
                    <th className="c360-text-right">Open Rate</th>
                    <th className="c360-text-right">Click Rate</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="c360-text-center c360-text-muted c360-p-8"
                      >
                        {notConfigured
                          ? "No data — satellite not configured."
                          : "No campaigns found."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="c360-flex c360-items-center c360-gap-2">
                            <Mail size={15} className="c360-text-muted" />
                            <span className="c360-font-medium">{c.name}</span>
                          </div>
                        </td>
                        <td>
                          <Badge color={STATUS_COLOR[c.status]}>
                            {c.status}
                          </Badge>
                        </td>
                        <td className="c360-text-sm c360-text-right">
                          {c.recipients.toLocaleString()}
                        </td>
                        <td className="c360-text-sm c360-text-right">
                          {c.sent.toLocaleString()}
                        </td>
                        <td className="c360-text-sm c360-text-right">
                          {openRate(c)}
                        </td>
                        <td className="c360-text-sm c360-text-right">
                          {clickRate(c)}
                        </td>
                        <td className="c360-text-sm c360-text-muted">
                          {formatRelativeTime(c.createdAt)}
                        </td>
                        <td>
                          <div className="c360-flex c360-flex-wrap c360-gap-1">
                            <Link
                              href={`${ROUTES.CAMPAIGNS}/${encodeURIComponent(c.id)}`}
                              title="Open detail placeholder"
                            >
                              <Button variant="ghost" size="sm" type="button">
                                <Eye size={14} />
                              </Button>
                            </Link>
                            {c.status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Pause campaign"
                                type="button"
                                loading={actionLoading === `pause-${c.id}`}
                                onClick={() => void handleAction(c.id, "pause")}
                              >
                                <Pause size={14} />
                              </Button>
                            )}
                            {c.status === "paused" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Resume campaign"
                                type="button"
                                loading={actionLoading === `resume-${c.id}`}
                                onClick={() =>
                                  void handleAction(c.id, "resume")
                                }
                              >
                                <Play size={14} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Analytics (coming soon)"
                              disabled
                              type="button"
                            >
                              <BarChart2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete campaign"
                              type="button"
                              loading={actionLoading === `delete-${c.id}`}
                              onClick={() => void handleAction(c.id, "delete")}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="c360-card-search-header c360-card-search-header--footer">
              <Pagination
                page={page}
                totalPages={Math.max(1, Math.ceil(filtered.length / 10))}
                total={filtered.length}
                onPageChange={setPage}
              />
            </div>
          </Card>
        )}

        <div className="c360-mt-6">
          <Card
            title="Campaign Reviews"
            subtitle="User feedback on your campaigns"
            actions={<Star size={16} className="c360-text-warning" />}
          >
            <ReviewList reviews={[]} entityName="campaigns" />
          </Card>
        </div>

        <div className="c360-mt-6">
          <CqlPlaygroundCard />
        </div>
      </div>
    </DashboardPageLayout>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  Mail,
  Clock,
  RefreshCw,
  Plus,
  LayoutList,
  Wrench,
} from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn, formatRelativeTime } from "@/lib/utils";
import { ROUTES, sequenceDetailRoute } from "@/lib/routes";
import { FEATURE_GATES } from "@/lib/featureAccess";
import { useRole } from "@/context/RoleContext";
import { useCampaignSequences } from "@/hooks/useCampaignSequences";
import { campaignsService } from "@/services/graphql/campaignsService";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, "green" | "yellow" | "gray"> = {
  active: "green",
  paused: "yellow",
  draft: "gray",
};

export default function SequencesPage() {
  const { checkAccess } = useRole();
  const canAccess = checkAccess("campaigns");
  const { sequences, loading, error, notConfigured, refresh, clearError } =
    useCampaignSequences();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleSeqAction = async (
    id: string,
    action: "pause" | "resume" | "delete",
  ) => {
    setActionLoading(`${action}-${id}`);
    try {
      if (action === "pause") await campaignsService.pauseSequence(id);
      else if (action === "resume") await campaignsService.resumeSequence(id);
      else await campaignsService.deleteSequence(id);
      toast.success(
        action === "delete" ? "Sequence deleted." : `Sequence ${action}d.`,
      );
      void refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to ${action} sequence.`,
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (!canAccess) {
    return (
      <DashboardPageLayout>
        <div className="c360-p-6">
          <h1 className="c360-standalone-header__title">Sequences</h1>
          <Alert variant="warning" className="c360-mt-4">
            {FEATURE_GATES.campaigns.label} (including sequences) is available
            on <strong>Professional</strong> and <strong>Enterprise</strong>{" "}
            plans. <Link href={ROUTES.BILLING}>View billing</Link> to upgrade.
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
            <h1 className="c360-standalone-header__title">Sequences</h1>
            <p className="c360-standalone-header__subtitle">
              Multi-step email workflows from the campaign satellite.
            </p>
          </div>
          <div className="c360-badge-row">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCw size={14} className={cn(loading && "c360-spin")} />
              Refresh
            </Button>
            <Link href={ROUTES.CAMPAIGNS}>
              <Button variant="outline" size="sm" type="button">
                Campaigns
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() =>
                void (async () => {
                  const name = window.prompt("Sequence name:");
                  if (!name?.trim()) return;
                  try {
                    await campaignsService.createSequence({
                      name: name.trim(),
                    });
                    toast.success("Sequence created.");
                    void refresh();
                  } catch (err) {
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "Failed to create sequence.",
                    );
                  }
                })()
              }
            >
              <Plus size={15} />
              New sequence
            </Button>
          </div>
        </div>

        {error && (
          <Alert
            variant="danger"
            className="c360-mb-4"
            onClose={() => clearError()}
          >
            {error}
          </Alert>
        )}

        <Tabs defaultValue="list" variant="underline" className="c360-mb-4">
          <TabsList>
            <TabsTrigger value="list" icon={<LayoutList size={14} />}>
              List
            </TabsTrigger>
            <TabsTrigger value="builder" icon={<Wrench size={14} />}>
              Builder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="c360-mt-4">
            {notConfigured && (
              <Alert variant="warning" className="c360-mb-4">
                Campaign service is not configured (CAMPAIGN_API_URL not set).
                Sequences will appear here once the satellite service is
                connected.
              </Alert>
            )}

            {loading ? (
              <p className="c360-page-subtitle">Loading sequences…</p>
            ) : !notConfigured && sequences.length === 0 ? (
              <Card>
                <div className="c360-empty-state">
                  <GitBranch size={36} className="c360-mb-4 c360-opacity-30" />
                  <p>No sequences returned from the campaign service.</p>
                </div>
              </Card>
            ) : (
              <div className="c360-section-stack">
                {sequences.map((row) => {
                  const status = row.status;
                  const steps = row.stepCount;
                  const activeContacts = row.activeContacts;

                  return (
                    <Card key={row.id}>
                      <div className="c360-seq-card-inner">
                        <div className="c360-seq-header">
                          <div className="c360-flex c360-items-center c360-gap-3">
                            <div className="c360-seq-icon-box">
                              <GitBranch
                                size={18}
                                className="c360-text-primary"
                              />
                            </div>
                            <div>
                              <Link
                                href={sequenceDetailRoute(row.id)}
                                className="c360-seq-name c360-seq-name--link"
                              >
                                {row.name}
                              </Link>
                              <div className="c360-seq-meta">
                                {row.createdAt
                                  ? `Created ${formatRelativeTime(row.createdAt)} · `
                                  : ""}
                                {activeContacts} active contacts · {steps} step
                                {steps !== 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                          <div className="c360-badge-row">
                            <Badge color={STATUS_COLOR[status] ?? "gray"}>
                              {status}
                            </Badge>
                            {status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                title="Pause sequence"
                                loading={actionLoading === `pause-${row.id}`}
                                onClick={() =>
                                  void handleSeqAction(row.id, "pause")
                                }
                              >
                                <Clock size={14} />
                              </Button>
                            )}
                            {status === "paused" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                title="Resume sequence"
                                loading={actionLoading === `resume-${row.id}`}
                                onClick={() =>
                                  void handleSeqAction(row.id, "resume")
                                }
                              >
                                <Plus size={14} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              title="Delete sequence"
                              loading={actionLoading === `delete-${row.id}`}
                              onClick={() =>
                                void handleSeqAction(row.id, "delete")
                              }
                            >
                              <GitBranch
                                size={14}
                                className="c360-opacity-50"
                              />
                            </Button>
                          </div>
                        </div>

                        <div className="c360-flex c360-items-center c360-flex-wrap">
                          {steps > 0 ? (
                            Array.from({ length: steps }).map((_, idx) => (
                              <div
                                key={idx}
                                className="c360-flex c360-items-center"
                              >
                                <div
                                  className={cn(
                                    "c360-seq-step-pill",
                                    idx % 2 === 0
                                      ? "c360-seq-step-pill--mail"
                                      : "c360-seq-step-pill--wait",
                                  )}
                                >
                                  {idx % 2 === 0 ? (
                                    <Mail size={12} />
                                  ) : (
                                    <Clock size={12} />
                                  )}
                                  Step {idx + 1}
                                </div>
                                {idx < steps - 1 && (
                                  <div className="c360-seq-pill-connector" />
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="c360-text-xs c360-text-muted">
                              No steps in payload (or empty)
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="builder" className="c360-mt-4">
            <Card>
              <div className="c360-p-4">
                <h2 className="c360-standalone-header__title c360-text-110 c360-mb-2">
                  Sequence builder
                </h2>
                <p className="c360-page-subtitle c360-mb-3">
                  Click a sequence name to open its step editor, or use the
                  controls below to manage steps inline.
                </p>
                {sequences.length === 0 ? (
                  <Alert variant="info">
                    No sequences to edit — create one first using{" "}
                    <strong>New sequence</strong>.
                  </Alert>
                ) : (
                  <div className="c360-section-stack">
                    {sequences.map((row) => (
                      <div key={row.id} className="c360-seq-builder-row">
                        <span className="c360-seq-name">{row.name}</span>
                        <Link href={sequenceDetailRoute(row.id)}>
                          <Button variant="outline" size="sm" type="button">
                            <Wrench size={13} />
                            Edit steps
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardPageLayout>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { OpenJobsDrawerButton } from "@/components/feature/jobs/OpenJobsDrawerButton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { isUsageUnlimited, usageProgressPercent } from "@/lib/usageDisplay";
import { formatNumber } from "@/lib/utils";
import type { FeatureOverview } from "@/graphql/generated/types";

export interface FeatureOverviewPanelProps {
  overview: FeatureOverview | null;
  loading?: boolean;
  /** SuperAdmin-only: show reset control (still requires confirm). */
  showResetUsage?: boolean;
  onResetUsage?: (feature: string) => Promise<void>;
  resetProcessing?: boolean;
}

export function FeatureOverviewPanel({
  overview,
  loading,
  showResetUsage,
  onResetUsage,
  resetProcessing,
}: FeatureOverviewPanelProps) {
  const [resetOpen, setResetOpen] = useState(false);

  if (loading) {
    return (
      <Card>
        <p className="c360-page-subtitle">Loading feature detail…</p>
      </Card>
    );
  }

  if (!overview) return null;

  const u = overview.usage;
  const unlimited = u ? isUsageUnlimited(u) : false;
  const pct = u ? usageProgressPercent(u) : 0;

  return (
    <>
      <Card
        title={`${overview.feature}`}
        subtitle="Usage, activity, and scheduler jobs"
      >
        <div className="c360-card-body">
          <Tabs defaultValue="usage" variant="underline">
            <TabsList>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="activities">
                Activity
                {overview.activities.length > 0 ? (
                  <Badge color="blue" className="c360-ml-2">
                    {overview.activities.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="jobs">
                Jobs
                {overview.jobs.length > 0 ? (
                  <Badge color="blue" className="c360-ml-2">
                    {overview.jobs.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="c360-tab-panel">
              {u ? (
                <>
                  {unlimited ? (
                    <div className="c360-mb-3">
                      <Badge color="green">Unlimited</Badge>
                      <p className="c360-text-sm c360-mt-2 c360-mb-0">
                        <strong>{formatNumber(u.used)}</strong> used (no cap on
                        this plan)
                      </p>
                    </div>
                  ) : (
                    <div className="c360-mb-3">
                      <Progress
                        value={pct}
                        max={100}
                        showValue
                        label="Used vs limit"
                        color={pct >= 80 ? "danger" : "primary"}
                        size="sm"
                      />
                      <p className="c360-text-sm c360-text-muted c360-mt-2 c360-mb-0">
                        <strong>{formatNumber(u.used)}</strong> /{" "}
                        <strong>{formatNumber(u.limit)}</strong> ·{" "}
                        <strong>{formatNumber(u.remaining)}</strong> remaining
                      </p>
                    </div>
                  )}
                  {u.resetAt && (
                    <p className="c360-text-sm c360-text-muted">
                      Resets {new Date(u.resetAt).toLocaleString()}
                    </p>
                  )}
                  {showResetUsage && onResetUsage && (
                    <div className="c360-mt-4">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setResetOpen(true)}
                      >
                        Reset usage (testing)
                      </Button>
                      <p className="c360-text-xs c360-text-muted c360-mt-2 c360-mb-0">
                        Admin/testing only. Calls <code>usage.resetUsage</code>.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="c360-page-subtitle">
                  No usage row for this feature yet.
                </p>
              )}
            </TabsContent>

            <TabsContent value="activities" className="c360-tab-panel">
              {overview.activities.length === 0 ? (
                <p className="c360-page-subtitle c360-m-0">
                  No recent activities linked to this feature.
                </p>
              ) : (
                <div className="c360-table-wrapper">
                  <table className="c360-table">
                    <thead>
                      <tr>
                        <th>Service / action</th>
                        <th>Status</th>
                        <th>Results</th>
                        <th>When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.activities.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <span className="c360-fw-medium">
                              {a.serviceType}
                            </span>
                            <span className="c360-text-muted">
                              {" "}
                              · {a.actionType}
                            </span>
                          </td>
                          <td>
                            <Badge color="gray">{a.status}</Badge>
                          </td>
                          <td className="c360-text-muted">
                            {formatNumber(a.resultCount)}
                            {a.errorMessage ? (
                              <span className="c360-text-danger c360-block c360-text-xs">
                                {a.errorMessage}
                              </span>
                            ) : null}
                          </td>
                          <td className="c360-text-muted c360-text-sm">
                            {new Date(a.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="c360-text-sm c360-mt-3 c360-mb-0">
                <Link href="/activities?tab=feed" className="c360-link">
                  Open full activity feed →
                </Link>
              </p>
            </TabsContent>

            <TabsContent value="jobs" className="c360-tab-panel">
              {overview.jobs.length === 0 ? (
                <p className="c360-page-subtitle c360-m-0">
                  No scheduler jobs matched for this feature.
                </p>
              ) : (
                <div className="c360-table-wrapper">
                  <table className="c360-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Family</th>
                        <th>Status</th>
                        <th>Job ID</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.jobs.map((j) => (
                        <tr key={j.id}>
                          <td className="c360-mono c360-text-sm">
                            {j.jobType}
                          </td>
                          <td className="c360-text-muted c360-text-sm">
                            {j.jobFamily}
                          </td>
                          <td>
                            <Badge color="blue">{j.status}</Badge>
                          </td>
                          <td className="c360-mono c360-text-sm">{j.jobId}</td>
                          <td className="c360-text-muted c360-text-sm">
                            {new Date(j.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="c360-text-sm c360-mt-3 c360-mb-0">
                <OpenJobsDrawerButton type="button" className="c360-link">
                  Open jobs →
                </OpenJobsDrawerButton>
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      <ConfirmModal
        isOpen={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={async () => {
          try {
            await onResetUsage?.(overview.feature);
            setResetOpen(false);
          } catch {
            /* parent shows toast */
          }
        }}
        title="Reset usage?"
        message={`Reset usage counters for “${overview.feature}”? This is for testing/admin only.`}
        confirmLabel="Reset"
        processing={resetProcessing}
      />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  RotateCcw,
  GitCommit,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { adminService, Deployment } from "@/services/graphql/adminService";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Skeleton } from "@/components/shared/Skeleton";
import { cn, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  running: <CheckCircle size={15} className="c360-text-success" />,
  deploying: <Loader2 size={15} className="c360-text-primary c360-spin" />,
  failed: <XCircle size={15} className="c360-text-danger" />,
  rolled_back: <RotateCcw size={15} className="c360-text-muted" />,
};

const STATUS_COLOR: Record<string, string> = {
  running: "success",
  deploying: "primary",
  failed: "danger",
  rolled_back: "secondary",
};

export default function DeploymentsPage() {
  const { loading: authLoading } = useSessionGuard({ requireAdmin: true });
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollbackId, setRollbackId] = useState<string | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listDeployments();
      setDeployments(data);
    } catch {
      setDeployments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading]);

  const handleRollback = async () => {
    if (!rollbackId) return;
    setRollbackLoading(true);
    try {
      await adminService.rollbackDeployment(rollbackId);
      toast.success("Rollback initiated successfully");
      setRollbackId(null);
      load();
    } catch {
      toast.error("Failed to initiate rollback");
    } finally {
      setRollbackLoading(false);
    }
  };

  if (authLoading) return <div className="c360-spinner c360-spinner--page" />;

  return (
    <div className="c360-p-6">
      <div className="c360-page-header">
        <div className="c360-standalone-header c360-mb-0">
          <h1 className="c360-standalone-header__title">Deployments</h1>
          <p className="c360-standalone-header__subtitle">
            Production and staging deployment history
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={15} className={cn(loading && "c360-spin")} />
          Refresh
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="c360-section-stack c360-card-inner-pad c360-gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={72} />
            ))}
          </div>
        ) : (
          <div className="c360-table-wrapper">
            <table className="c360-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Environment</th>
                  <th>Status</th>
                  <th>Commit</th>
                  <th>Deployed By</th>
                  <th>Deployed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {deployments.map((d) => (
                  <tr key={d.id}>
                    <td className="c360-font-semibold">{d.version}</td>
                    <td>
                      <Badge
                        color={
                          d.environment === "production"
                            ? "primary"
                            : "secondary"
                        }
                      >
                        {d.environment}
                      </Badge>
                    </td>
                    <td>
                      <div className="c360-badge-row c360-gap-1">
                        {STATUS_ICONS[d.status]}
                        <Badge
                          color={
                            STATUS_COLOR[d.status] as
                              | "success"
                              | "danger"
                              | "primary"
                              | "secondary"
                          }
                        >
                          {d.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </td>
                    <td>
                      <div className="c360-badge-row c360-gap-1">
                        <GitCommit size={13} className="c360-text-muted" />
                        <code className="c360-commit-code">
                          {d.commitSha.slice(0, 7)}
                        </code>
                        <span className="c360-commit-msg">
                          {d.commitMessage}
                        </span>
                      </div>
                    </td>
                    <td className="c360-text-sm c360-text-muted">
                      {d.deployedBy}
                    </td>
                    <td className="c360-text-sm c360-text-muted">
                      <div className="c360-flex c360-items-center c360-gap-1">
                        <Clock size={12} />
                        {formatRelativeTime(d.deployedAt)}
                      </div>
                    </td>
                    <td>
                      {d.rollbackAvailable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRollbackId(d.id)}
                        >
                          <RotateCcw size={13} />
                          Rollback
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmModal
        isOpen={!!rollbackId}
        onClose={() => setRollbackId(null)}
        onConfirm={handleRollback}
        title="Confirm Rollback"
        variant="warning"
        confirmText="Rollback"
        isLoading={rollbackLoading}
      >
        Are you sure you want to rollback this deployment? The previous version
        will be restored to production.
      </ConfirmModal>
    </div>
  );
}

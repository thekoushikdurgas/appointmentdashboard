"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/patterns/Pagination";
import {
  billingService,
  type PaymentSubmission,
} from "@/services/graphql/billingService";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 20;

function statusColor(
  status: string,
): "green" | "orange" | "red" | "gray" | "blue" {
  if (status === "approved") return "green";
  if (status === "declined") return "red";
  if (status === "pending") return "orange";
  return "gray";
}

export function BillingAdminPaymentQueue() {
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selected, setSelected] = useState<PaymentSubmission | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const res = await billingService.getPaymentSubmissions({
        status: statusFilter || null,
        limit: PAGE_SIZE,
        offset,
      });
      const conn = res.billing.paymentSubmissions;
      setSubmissions(conn.items);
      setTotal(conn.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApprove = async (id: string) => {
    setProcessing(true);
    try {
      await billingService.approvePayment(id);
      toast.success("Payment approved.");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await billingService.declinePayment({
        submissionId: selected.id,
        reason: declineReason,
      });
      toast.success("Payment declined.");
      setDeclineOpen(false);
      setSelected(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Decline failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Card
        title="Payment submissions queue"
        actions={
          <div className="c360-flex c360-gap-2">
            <div className="c360-status-btn-group">
              {["", "pending", "approved", "declined"].map((s) => (
                <button
                  key={s || "all"}
                  type="button"
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={cn(
                    "c360-status-btn",
                    statusFilter === s && "c360-status-btn--active",
                  )}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={
                <RefreshCw size={13} className={cn(loading && "c360-spin")} />
              }
              onClick={() => void load()}
            >
              Refresh
            </Button>
          </div>
        }
      >
        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="c360-text-center c360-p-6">
            <span className="c360-spinner" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="c360-empty-state">No payment submissions found.</div>
        ) : (
          <div className="c360-table-wrapper">
            <table className="c360-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Credits</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="c360-text-muted">
                      {sub.userEmail ?? sub.userId}
                    </td>
                    <td>${sub.amount.toFixed(2)}</td>
                    <td>{sub.creditsToAdd.toLocaleString()}</td>
                    <td className="c360-text-muted">
                      {sub.planTier
                        ? `${sub.planTier} / ${sub.planPeriod}`
                        : "—"}
                    </td>
                    <td>
                      <Badge color={statusColor(sub.status)}>
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="c360-text-muted">
                      {formatDate(sub.createdAt)}
                    </td>
                    <td>
                      <div className="c360-badge-row">
                        {sub.screenshotDownloadUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View screenshot"
                            onClick={() =>
                              window.open(sub.screenshotDownloadUrl!, "_blank")
                            }
                          >
                            <Eye size={13} />
                          </Button>
                        )}
                        {sub.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Approve"
                              loading={processing}
                              onClick={() => void handleApprove(sub.id)}
                            >
                              <CheckCircle
                                size={13}
                                className="c360-text-success"
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Decline"
                              onClick={() => {
                                setSelected(sub);
                                setDeclineReason("");
                                setDeclineOpen(true);
                              }}
                            >
                              <XCircle size={13} className="c360-text-danger" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="c360-table-footer">
            <Pagination
              page={page}
              total={total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>

      <Modal
        isOpen={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline payment"
        size="sm"
      >
        <div className="c360-section-stack">
          <p className="c360-text-sm c360-text-muted">
            Provide a reason for declining (shown to the user).
          </p>
          <Input
            label="Decline reason"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="e.g. Incorrect amount"
          />
          <div className="c360-modal-actions">
            <Button variant="secondary" onClick={() => setDeclineOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={processing}
              onClick={() => void handleDecline()}
            >
              Decline
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  billingService,
  type PaymentSubmission,
} from "@/services/graphql/billingService";
import { parseOperationError } from "@/lib/errorParser";

function statusBadgeColor(
  s: string,
): "gray" | "blue" | "green" | "red" | "yellow" {
  if (s === "approved") return "green";
  if (s === "declined") return "red";
  if (s === "pending") return "yellow";
  return "gray";
}

export interface BillingMyPaymentRequestsProps {
  /** Increment to refetch after submitting a new request. */
  refreshKey?: number;
}

export function BillingMyPaymentRequests({
  refreshKey = 0,
}: BillingMyPaymentRequestsProps) {
  const [items, setItems] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await billingService.getMyPaymentSubmissions({
        limit: 50,
        offset: 0,
      });
      setItems(r.billing.myPaymentSubmissions.items);
    } catch (e) {
      setError(parseOperationError(e, "billing").userMessage);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <Card
      title="Your payment requests"
      subtitle="Manual UPI submissions awaiting or completed admin review"
      actions={
        <Button
          type="button"
          size="sm"
          variant="secondary"
          leftIcon={<RefreshCw size={14} />}
          onClick={() => void load()}
        >
          Refresh
        </Button>
      }
    >
      {loading ? (
        <div className="c360-text-center c360-p-4">
          <span className="c360-spinner" />
        </div>
      ) : error ? (
        <p className="c360-text-danger c360-text-sm">{error}</p>
      ) : items.length === 0 ? (
        <p className="c360-text-muted c360-text-sm">
          No payment requests yet. Use Checkout or Payment Proof to submit one.
        </p>
      ) : (
        <div className="c360-section-stack">
          {items.map((row) => (
            <div
              key={row.id}
              className="c360-flex c360-flex-wrap c360-gap-2 c360-items-center c360-justify-between c360-p-3 c360-rounded-md c360-billing-request-row"
            >
              <div>
                <div className="c360-flex c360-gap-2 c360-items-center c360-mb-1">
                  <Badge color={statusBadgeColor(row.status)}>
                    {row.status}
                  </Badge>
                  <span className="c360-text-sm c360-font-medium">
                    ${row.amount.toFixed(2)}
                  </span>
                  <span className="c360-text-xs c360-text-muted">
                    +{row.creditsToAdd.toLocaleString()} credits (reference)
                  </span>
                </div>
                <div className="c360-text-xs c360-text-muted">
                  {row.addonPackageId
                    ? `Add-on: ${row.addonPackageId}`
                    : row.planTier
                      ? `Plan: ${row.planTier} / ${row.planPeriod ?? ""}`
                      : "Credits top-up"}
                  {" · "}
                  Submitted {new Date(row.createdAt).toLocaleString()}
                </div>
                {row.declineReason ? (
                  <p className="c360-text-xs c360-text-danger c360-mt-1">
                    {row.declineReason}
                  </p>
                ) : null}
              </div>
              {row.screenshotDownloadUrl ? (
                <a
                  href={row.screenshotDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="c360-link c360-text-sm"
                >
                  View receipt
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

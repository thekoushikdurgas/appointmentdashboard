"use client";

import { Copy, Info } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { PaymentInstructions } from "@/services/graphql/billingService";
import { toast } from "sonner";

type NullableInstructions = PaymentInstructions | null;

async function copyToClipboard(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Could not copy — try selecting the text manually.");
  }
}

function CopyableField({ label, value }: { label: string; value: string }) {
  return (
    <div className="c360-detail-row">
      <span className="c360-section-label">{label}</span>
      <div className="c360-billing-instruction-row__value">
        <span>{value}</span>
        <button
          type="button"
          className="c360-billing-copy-btn"
          aria-label={`Copy ${label}`}
          title="Copy"
          onClick={() => void copyToClipboard(label, value)}
        >
          <Copy size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export interface ManualPaymentInstructionsProps {
  instructions: NullableInstructions;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  /** When true, omit outer Card-style chrome (parent provides title). */
  embedded?: boolean;
}

export function ManualPaymentInstructions({
  instructions,
  loading,
  error,
  onRetry,
  embedded = false,
}: ManualPaymentInstructionsProps) {
  const body = loading ? (
    <div className="c360-text-center c360-p-4">
      <span className="c360-spinner" />
      <p className="c360-text-muted c360-text-sm c360-mt-2">
        Loading payment details…
      </p>
    </div>
  ) : error ? (
    <Alert variant="danger" title="Could not load payment details">
      <p className="c360-mb-3">{error}</p>
      {onRetry ? (
        <Button size="sm" variant="secondary" onClick={() => onRetry()}>
          Retry
        </Button>
      ) : null}
    </Alert>
  ) : instructions ? (
    <Alert variant="info" title="Pay with UPI (manual transfer)">
      <p className="c360-text-sm c360-text-muted c360-mb-3">
        {embedded
          ? "Transfer the amount shown above using these details, then upload your receipt below."
          : "Use these details in your UPI app, then upload your receipt screenshot below."}
      </p>
      <div className="c360-section-stack">
        {instructions.upiId ? (
          <div className="c360-detail-row">
            <span className="c360-section-label">UPI ID</span>
            <div className="c360-billing-instruction-row__value">
              <Badge color="blue">{instructions.upiId}</Badge>
              <button
                type="button"
                className="c360-billing-copy-btn"
                aria-label="Copy UPI ID"
                title="Copy UPI ID"
                onClick={() =>
                  void copyToClipboard("UPI ID", instructions.upiId)
                }
              >
                <Copy size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        ) : null}
        {instructions.phoneNumber ? (
          <CopyableField label="Phone" value={instructions.phoneNumber} />
        ) : null}
        {instructions.email ? (
          <CopyableField label="Email" value={instructions.email} />
        ) : null}
        {!instructions.upiId &&
          !instructions.phoneNumber &&
          !instructions.email && (
            <p className="c360-text-sm c360-text-muted">
              No UPI ID or contact fields are set. Ask your administrator to
              configure payment instructions.
            </p>
          )}
        {instructions.qrCodeDownloadUrl ? (
          <div className="c360-pt-2 c360-section-stack">
            <span className="c360-section-label">UPI QR code</span>
            {/* eslint-disable-next-line @next/next/no-img-element -- presigned URL (dynamic host / TTL) */}
            <img
              src={instructions.qrCodeDownloadUrl}
              alt="Scan this QR code to pay with UPI"
              className="c360-2fa-qr"
              loading="lazy"
            />
            <a
              href={instructions.qrCodeDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="c360-link c360-text-sm"
            >
              Open full size in new tab
            </a>
          </div>
        ) : instructions.qrCodeS3Key ? (
          <p className="c360-text-sm c360-text-muted c360-pt-2">
            QR preview is unavailable right now. Use the UPI ID above or contact
            support if you need a payment QR image.
          </p>
        ) : null}
      </div>
    </Alert>
  ) : (
    <Alert variant="warning" title="No payment instructions">
      Payment instructions have not been configured by the admin yet.
    </Alert>
  );

  if (embedded) {
    return <div className="c360-section-stack">{body}</div>;
  }

  return body;
}

export function ManualPaymentInstructionsFooter() {
  return (
    <div className="c360-flex c360-gap-2 c360-items-center c360-text-xs c360-text-muted">
      <Info size={12} />
      After paying, upload your receipt using the field below (or paste an S3
      key if you uploaded elsewhere).
    </div>
  );
}

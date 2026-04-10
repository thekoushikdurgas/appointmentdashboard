"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Info, Copy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import {
  billingService,
  type PaymentInstructions,
} from "@/services/graphql/billingService";
import { toast } from "sonner";
import { parseOperationError } from "@/lib/errorParser";

/** Avoid `| null>` in generics — TSX parses `null>` as JSX and trips no-unescaped-entities. */
type NullableInstructions = PaymentInstructions | null;
type NullableString = string | null;

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

export interface BillingPaymentProofFormProps {
  onSubmitted?: () => void;
}

export function BillingPaymentProofForm({
  onSubmitted,
}: BillingPaymentProofFormProps) {
  const [instructions, setInstructions] =
    useState<NullableInstructions>(null);
  const [loadingInstructions, setLoadingInstructions] = useState(true);
  const [instructionsError, setInstructionsError] =
    useState<NullableString>(null);

  const [screenshotKey, setScreenshotKey] = useState("");
  const [amount, setAmount] = useState("");
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const [planTier, setPlanTier] = useState("");
  const [planPeriod, setPlanPeriod] = useState("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<NullableString>(null);
  const [submitted, setSubmitted] = useState(false);

  const loadInstructions = useCallback(() => {
    setLoadingInstructions(true);
    setInstructionsError(null);
    billingService
      .getPaymentInstructions()
      .then((res) => {
        setInstructions(res.billing.paymentInstructions);
      })
      .catch((err: unknown) => {
        setInstructions(null);
        setInstructionsError(parseOperationError(err, "jobs").userMessage);
      })
      .finally(() => setLoadingInstructions(false));
  }, []);

  useEffect(() => {
    void loadInstructions();
  }, [loadInstructions]);

  const handleSubmit = async () => {
    if (!screenshotKey.trim()) {
      setError("Screenshot S3 key is required.");
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    const creditsNum = parseInt(creditsToAdd, 10);
    if (isNaN(creditsNum) || creditsNum <= 0) {
      setError("Please enter a valid credits-to-add value.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await billingService.submitPaymentProof({
        screenshotS3Key: screenshotKey.trim(),
        amount: amountNum,
        creditsToAdd: creditsNum,
        planTier: planTier.trim() || undefined,
        planPeriod: planPeriod || undefined,
      });
      setSubmitted(true);
      toast.success("Payment proof submitted — awaiting admin review.");
      onSubmitted?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <Alert variant="success" title="Proof submitted">
          Your payment proof has been submitted and is awaiting admin review.
          You will receive credits once the payment is approved.
        </Alert>
      </Card>
    );
  }

  return (
    <Card title="Submit payment proof">
      <div className="c360-section-stack">
        {loadingInstructions ? (
          <div className="c360-text-center c360-p-4">
            <span className="c360-spinner" />
            <p className="c360-text-muted c360-text-sm c360-mt-2">
              Loading payment details…
            </p>
          </div>
        ) : instructionsError ? (
          <Alert variant="danger" title="Could not load payment details">
            <p className="c360-mb-3">{instructionsError}</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void loadInstructions()}
            >
              Retry
            </Button>
          </Alert>
        ) : instructions ? (
          <Alert variant="info" title="Pay with UPI (manual transfer)">
            <p className="c360-text-sm c360-text-muted c360-mb-3">
              Use these details in your UPI app, then upload your receipt
              screenshot below.
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
                    No UPI ID or contact fields are set. Ask your administrator
                    to configure payment instructions on the gateway.
                  </p>
                )}
              {instructions.qrCodeDownloadUrl ? (
                <div className="c360-pt-2">
                  <a
                    href={instructions.qrCodeDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="c360-link"
                  >
                    Download QR code
                  </a>
                </div>
              ) : null}
            </div>
          </Alert>
        ) : (
          <Alert variant="warning" title="No payment instructions">
            Payment instructions have not been configured by the admin yet.
          </Alert>
        )}

        <div className="c360-flex c360-gap-2 c360-items-center c360-text-xs c360-text-muted">
          <Info size={12} />
          After paying, upload your screenshot to S3 and enter the key below.
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Input
          label="Screenshot S3 key *"
          value={screenshotKey}
          onChange={(e) => setScreenshotKey(e.target.value)}
          placeholder="receipts/my-payment.png"
        />
        <Input
          label="Amount paid *"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="29.00"
        />
        <Input
          label="Credits to add *"
          type="number"
          value={creditsToAdd}
          onChange={(e) => setCreditsToAdd(e.target.value)}
          placeholder="1000"
        />
        <Input
          label="Plan tier (optional)"
          value={planTier}
          onChange={(e) => setPlanTier(e.target.value)}
          placeholder="starter"
        />
        <Input
          label="Plan period"
          value={planPeriod}
          onChange={(e) => setPlanPeriod(e.target.value)}
          placeholder="monthly"
        />
        <div className="c360-modal-actions">
          <Button
            loading={submitting}
            leftIcon={<Upload size={14} />}
            onClick={() => void handleSubmit()}
          >
            Submit proof
          </Button>
        </div>
      </div>
    </Card>
  );
}

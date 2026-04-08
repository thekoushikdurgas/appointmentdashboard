"use client";

import { useState, useEffect } from "react";
import { Upload, Info } from "lucide-react";
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

export interface BillingPaymentProofFormProps {
  onSubmitted?: () => void;
}

export function BillingPaymentProofForm({
  onSubmitted,
}: BillingPaymentProofFormProps) {
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(
    null,
  );
  const [loadingInstructions, setLoadingInstructions] = useState(true);

  const [screenshotKey, setScreenshotKey] = useState("");
  const [amount, setAmount] = useState("");
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const [planTier, setPlanTier] = useState("");
  const [planPeriod, setPlanPeriod] = useState("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLoadingInstructions(true);
    billingService
      .getPaymentInstructions()
      .then((res) => {
        setInstructions(res.billing.paymentInstructions);
      })
      .catch(() => setInstructions(null))
      .finally(() => setLoadingInstructions(false));
  }, []);

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
          </div>
        ) : instructions ? (
          <Alert variant="info" title="Payment details">
            <div className="c360-section-stack">
              {instructions.upiId && (
                <div className="c360-detail-row">
                  <span className="c360-section-label">UPI ID</span>
                  <Badge color="blue">{instructions.upiId}</Badge>
                </div>
              )}
              {instructions.phoneNumber && (
                <div className="c360-detail-row">
                  <span className="c360-section-label">Phone</span>
                  <span>{instructions.phoneNumber}</span>
                </div>
              )}
              {instructions.email && (
                <div className="c360-detail-row">
                  <span className="c360-section-label">Email</span>
                  <span>{instructions.email}</span>
                </div>
              )}
              {instructions.qrCodeDownloadUrl && (
                <div>
                  <a
                    href={instructions.qrCodeDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="c360-link"
                  >
                    Download QR code
                  </a>
                </div>
              )}
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

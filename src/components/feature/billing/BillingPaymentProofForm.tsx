"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  billingService,
  type PaymentInstructions,
} from "@/services/graphql/billingService";
import { toast } from "sonner";
import { parseOperationError } from "@/lib/errorParser";
import { uploadPaymentReceiptImage } from "@/lib/uploadPaymentReceipt";
import {
  ManualPaymentInstructions,
  ManualPaymentInstructionsFooter,
} from "@/components/feature/billing/ManualPaymentInstructions";
import { PaymentReceiptDropzone } from "@/components/feature/billing/PaymentReceiptDropzone";

/** Avoid `| null>` in generics — TSX parses `null>` as JSX and trips no-unescaped-entities. */
type NullableInstructions = PaymentInstructions | null;
type NullableString = string | null;

export interface BillingPaymentProofFormProps {
  onSubmitted?: () => void;
}

export function BillingPaymentProofForm({
  onSubmitted,
}: BillingPaymentProofFormProps) {
  const [instructions, setInstructions] = useState<NullableInstructions>(null);
  const [loadingInstructions, setLoadingInstructions] = useState(true);
  const [instructionsError, setInstructionsError] =
    useState<NullableString>(null);

  const [screenshotKey, setScreenshotKey] = useState("");
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const [planTier, setPlanTier] = useState("");
  const [planPeriod, setPlanPeriod] = useState("monthly");
  const [addonPackageId, setAddonPackageId] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
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
        setInstructionsError(parseOperationError(err, "billing").userMessage);
      })
      .finally(() => setLoadingInstructions(false));
  }, []);

  useEffect(() => {
    void loadInstructions();
  }, [loadInstructions]);

  const onPickReceiptFile = async (file: File) => {
    setUploadingFile(true);
    setError(null);
    try {
      const key = await uploadPaymentReceiptImage(file);
      setScreenshotKey(key);
      setReceiptFileName(file.name);
      toast.success("Receipt uploaded — key filled in below.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async () => {
    if (!screenshotKey.trim()) {
      setError("Upload a receipt image or enter the screenshot S3 key.");
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
    const addon = addonPackageId.trim();
    const tier = planTier.trim();
    const period = planPeriod.trim();
    if (addon && (tier || period)) {
      setError("Use either add-on package or plan fields, not both.");
      return;
    }
    if ((tier || period) && !(tier && period)) {
      setError("Set both plan tier and period, or leave both empty.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await billingService.submitPaymentProof({
        screenshotS3Key: screenshotKey.trim(),
        amount: amountNum,
        creditsToAdd: creditsNum,
        planTier: tier || undefined,
        planPeriod: tier && period ? period : undefined,
        addonPackageId: addon || undefined,
      });
      setSubmitted(true);
      toast.success("Payment proof submitted — awaiting admin review.");
      onSubmitted?.();
    } catch (e) {
      const msg = parseOperationError(e, "billing").userMessage;
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
          You will receive credits or your plan once the payment is approved.
        </Alert>
      </Card>
    );
  }

  return (
    <Card title="Submit payment proof">
      <div className="c360-section-stack">
        <ManualPaymentInstructions
          instructions={instructions}
          loading={loadingInstructions}
          error={instructionsError}
          onRetry={() => void loadInstructions()}
        />

        <ManualPaymentInstructionsFooter />

        {error ? <Alert variant="danger">{error}</Alert> : null}

        <PaymentReceiptDropzone
          uploading={uploadingFile}
          statusLabel={
            receiptFileName ??
            (screenshotKey.trim() ? "Receipt ready (S3 key set)" : null)
          }
          onFile={(f) => void onPickReceiptFile(f)}
        />

        <Input
          label="Screenshot S3 key *"
          value={screenshotKey}
          onChange={(e) => setScreenshotKey(e.target.value)}
          placeholder="Filled automatically after upload, or paste a key"
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
          label="Add-on package id (optional)"
          value={addonPackageId}
          onChange={(e) => setAddonPackageId(e.target.value)}
          placeholder="e.g. small — leave empty if paying for a plan"
        />
        <Input
          label="Plan tier (optional)"
          value={planTier}
          onChange={(e) => setPlanTier(e.target.value)}
          placeholder="e.g. 5k"
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

"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Upload } from "lucide-react";
import { applyVars } from "@/lib/applyCssVars";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Radio, RadioGroup } from "@/components/ui/Radio";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import type { BillingPlanCard } from "./BillingPlanCards";
import { cn } from "@/lib/utils";
import type {
  AddonPackage,
  PaymentInstructions,
} from "@/services/graphql/billingService";
import { ManualPaymentInstructions } from "@/components/feature/billing/ManualPaymentInstructions";
import { uploadPaymentReceiptImage } from "@/lib/uploadPaymentReceipt";
import { PaymentReceiptDropzone } from "@/components/feature/billing/PaymentReceiptDropzone";
import { toast } from "sonner";

const STEPS = ["Product", "Pay (UPI)", "Receipt"];

type BillingPeriod = "monthly" | "quarterly" | "yearly";

export interface BillingCheckoutWizardProps {
  plans: BillingPlanCard[];
  addons: AddonPackage[];
  effectivePlan: string;
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
  paymentInstructions: PaymentInstructions | null;
  paymentInstructionsLoading: boolean;
  paymentInstructionsError: string | null;
  onRetryPaymentInstructions: () => void;
  onSubmitPaymentRequest: (payload: {
    amount: number;
    screenshotS3Key: string;
    creditsToAdd: number;
    planTier?: string;
    planPeriod?: string;
    addonPackageId?: string;
  }) => Promise<void>;
}

export function BillingCheckoutWizard({
  plans,
  addons,
  effectivePlan,
  selectedPlanId,
  onSelectPlan,
  paymentInstructions,
  paymentInstructionsLoading,
  paymentInstructionsError,
  onRetryPaymentInstructions,
  onSubmitPaymentRequest,
}: BillingCheckoutWizardProps) {
  const [step, setStep] = useState(1);
  const [checkoutKind, setCheckoutKind] = useState<"plan" | "addon">("plan");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [selectedAddonId, setSelectedAddonId] = useState<string | null>(null);
  const [screenshotKey, setScreenshotKey] = useState("");
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPlanId) {
      setCheckoutKind("plan");
    }
  }, [selectedPlanId]);

  const selectedPlanData = plans.find((p) => p.id === selectedPlanId);
  const selectedAddon = addons.find((a) => a.id === selectedAddonId);

  const priceForPeriod = (
    p: BillingPlanCard | undefined,
    period: BillingPeriod,
  ) => {
    if (!p) return null;
    const fromMap = p.pricesByPeriod?.[period];
    if (typeof fromMap === "number" && Number.isFinite(fromMap)) return fromMap;
    return period === "monthly" ? p.price : null;
  };

  const creditsForPeriod = (
    p: BillingPlanCard | undefined,
    period: BillingPeriod,
  ) => {
    if (!p) return null;
    const c = p.creditsByPeriod?.[period];
    return typeof c === "number" && Number.isFinite(c) ? c : null;
  };

  const derivedAmount = (): number | null => {
    if (checkoutKind === "plan" && selectedPlanData) {
      return priceForPeriod(selectedPlanData, billingPeriod);
    }
    if (checkoutKind === "addon" && selectedAddon) {
      return selectedAddon.price;
    }
    return null;
  };

  const derivedCredits = (): number | null => {
    if (checkoutKind === "plan" && selectedPlanData) {
      return creditsForPeriod(selectedPlanData, billingPeriod);
    }
    if (checkoutKind === "addon" && selectedAddon) {
      return selectedAddon.credits;
    }
    return null;
  };

  const canAdvanceFromStep1 =
    checkoutKind === "plan"
      ? Boolean(selectedPlanId && selectedPlanId !== effectivePlan)
      : Boolean(selectedAddonId);

  const handleNext = () => {
    setFormError(null);
    if (step < 3) {
      if (step === 1 && !canAdvanceFromStep1) return;
      setStep((s) => s + 1);
    }
  };

  const onPickReceiptFile = async (file: File) => {
    setUploadingFile(true);
    setFormError(null);
    try {
      const key = await uploadPaymentReceiptImage(file);
      setScreenshotKey(key);
      setReceiptFileName(file.name);
      toast.success("Receipt uploaded.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setFormError(msg);
      toast.error(msg);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async () => {
    const amt = derivedAmount();
    const creds = derivedCredits();
    if (amt == null || creds == null) {
      setFormError("Could not read amount or credits from your selection.");
      return;
    }
    if (!screenshotKey.trim()) {
      setFormError("Upload a receipt image or enter the S3 key.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await onSubmitPaymentRequest({
        amount: amt,
        screenshotS3Key: screenshotKey.trim(),
        creditsToAdd: creds,
        planTier:
          checkoutKind === "plan" && selectedPlanId
            ? selectedPlanId
            : undefined,
        planPeriod:
          checkoutKind === "plan" && selectedPlanId ? billingPeriod : undefined,
        addonPackageId:
          checkoutKind === "addon" && selectedAddonId
            ? selectedAddonId
            : undefined,
      });
      setStep(1);
      setScreenshotKey("");
      setReceiptFileName(null);
      setSelectedAddonId(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const upgradePlans = plans.filter((p) => p.id !== effectivePlan);

  return (
    <Card
      title="Checkout (manual UPI)"
      subtitle="Choose a plan or add-on, pay via UPI, then submit proof for admin approval"
    >
      <div className="c360-mb-6">
        <div className="c360-wizard-step-row">
          {STEPS.map((label, i) => (
            <div key={label} className="c360-wizard-step-col">
              <div
                className={cn(
                  "c360-wizard-step-circle",
                  step > i + 1 && "c360-wizard-step-circle--done",
                  step === i + 1 && "c360-wizard-step-circle--active",
                )}
              >
                {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span
                className={cn(
                  "c360-wizard-step-label",
                  step === i + 1 && "c360-wizard-step-label--active",
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <Progress value={(step / 3) * 100} />
      </div>

      {step === 1 && (
        <div>
          <p className="c360-page-subtitle c360-mb-3">
            What are you paying for?
          </p>
          <RadioGroup
            name="checkout-kind"
            horizontal
            value={checkoutKind}
            onChange={(v) => {
              setCheckoutKind(v as "plan" | "addon");
              setFormError(null);
            }}
            className="c360-mb-4"
          >
            <Radio value="plan" label="Upgrade plan" />
            <Radio value="addon" label="Add-on credits" />
          </RadioGroup>

          {checkoutKind === "plan" && (
            <>
              <RadioGroup
                name="billing-period-checkout"
                horizontal
                value={billingPeriod}
                onChange={(v) => setBillingPeriod(v as BillingPeriod)}
                className="c360-mb-4"
              >
                <Radio value="monthly" label="Monthly" />
                <Radio value="quarterly" label="Quarterly" />
                <Radio value="yearly" label="Yearly" />
              </RadioGroup>
              <div className="c360-section-stack">
                {upgradePlans.map((p) => (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectPlan(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectPlan(p.id);
                      }
                    }}
                    className={cn(
                      "c360-flex c360-items-center c360-gap-3 c360-billing-checkout-plan-row",
                      selectedPlanId === p.id &&
                        "c360-billing-checkout-plan-row--selected",
                    )}
                  >
                    <div
                      className="c360-billing-checkout-plan-icon"
                      ref={(el) =>
                        applyVars(el, {
                          "--c360-billing-plan-icon-bg": p.bg,
                          "--c360-billing-plan-icon-fg": p.color,
                        })
                      }
                    >
                      {p.icon}
                    </div>
                    <div className="c360-flex-1">
                      <div className="c360-font-semibold">{p.name}</div>
                      <div className="c360-dropzone__hint">
                        {(() => {
                          const pr = priceForPeriod(p, billingPeriod);
                          const cr = creditsForPeriod(p, billingPeriod);
                          if (typeof pr === "number")
                            return `$${pr.toFixed(2)} · ${cr != null ? `${cr.toLocaleString()} credits` : "credits from catalog"}`;
                          return typeof p.price === "number"
                            ? `$${p.price}/mo`
                            : "See summary on next step";
                        })()}
                      </div>
                    </div>
                    {selectedPlanId === p.id && (
                      <CheckCircle size={18} color="var(--c360-primary)" />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {checkoutKind === "addon" && (
            <div className="c360-section-stack">
              {addons.map((a) => (
                <div
                  key={a.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedAddonId(a.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedAddonId(a.id);
                    }
                  }}
                  className={cn(
                    "c360-flex c360-items-center c360-gap-3 c360-billing-checkout-plan-row",
                    selectedAddonId === a.id &&
                      "c360-billing-checkout-plan-row--selected",
                  )}
                >
                  <div className="c360-flex-1">
                    <div className="c360-font-semibold">{a.name}</div>
                    <div className="c360-dropzone__hint">
                      ${a.price.toFixed(2)} · {a.credits.toLocaleString()}{" "}
                      credits
                    </div>
                  </div>
                  {selectedAddonId === a.id && (
                    <CheckCircle size={18} color="var(--c360-primary)" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="c360-section-stack">
          <div className="c360-result-box c360-result-box--neutral">
            <p className="c360-text-sm c360-mb-1">
              <strong>Your selection</strong>
            </p>
            {checkoutKind === "plan" && selectedPlanData ? (
              <p className="c360-page-subtitle">
                {selectedPlanData.name} ({billingPeriod}) —{" "}
                <strong>
                  ${derivedAmount() != null ? derivedAmount()!.toFixed(2) : "—"}
                </strong>
                {derivedCredits() != null
                  ? ` · ${derivedCredits()!.toLocaleString()} credits`
                  : null}
              </p>
            ) : checkoutKind === "addon" && selectedAddon ? (
              <p className="c360-page-subtitle">
                {selectedAddon.name} —{" "}
                <strong>${selectedAddon.price.toFixed(2)}</strong> ·{" "}
                {selectedAddon.credits.toLocaleString()} credits
              </p>
            ) : (
              <p className="c360-text-muted c360-text-sm">Nothing selected.</p>
            )}
          </div>
          <ManualPaymentInstructions
            embedded
            instructions={paymentInstructions}
            loading={paymentInstructionsLoading}
            error={paymentInstructionsError}
            onRetry={onRetryPaymentInstructions}
          />
        </div>
      )}

      {step === 3 && (
        <div className="c360-section-stack">
          <p className="c360-page-subtitle c360-mb-2">
            Upload your payment receipt. Amount and credits are taken from your
            selection:{" "}
            <strong>
              ${derivedAmount() != null ? derivedAmount()!.toFixed(2) : "—"} /{" "}
              {derivedCredits() != null
                ? `${derivedCredits()!.toLocaleString()} credits`
                : "—"}
            </strong>
          </p>
          {formError ? <Alert variant="danger">{formError}</Alert> : null}
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
            placeholder="Auto-filled after upload"
          />
        </div>
      )}

      <div className="c360-wizard-nav">
        {step > 1 && (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button
            disabled={step === 1 && !canAdvanceFromStep1}
            onClick={() => void handleNext()}
          >
            Next
          </Button>
        ) : (
          <Button
            loading={submitting}
            leftIcon={<Upload size={14} />}
            onClick={() => void handleSubmit()}
          >
            Submit payment request
          </Button>
        )}
      </div>
    </Card>
  );
}

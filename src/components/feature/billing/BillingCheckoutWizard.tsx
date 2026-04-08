"use client";

import { useState } from "react";
import { applyVars } from "@/lib/applyCssVars";
import { CheckCircle, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Radio, RadioGroup } from "@/components/ui/Radio";
import { Input } from "@/components/ui/Input";
import type { BillingPlanCard } from "./BillingPlanCards";
import { cn } from "@/lib/utils";

const CHECKOUT_STEPS = ["Select Plan", "Payment Method", "Confirm"];

interface BillingCheckoutWizardProps {
  plans: BillingPlanCard[];
  effectivePlan: string;
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
  onConfirm: (planId: string, period: string) => Promise<void>;
}

type BillingPeriod = "monthly" | "quarterly" | "yearly";

export function BillingCheckoutWizard({
  plans,
  effectivePlan,
  selectedPlanId,
  onSelectPlan,
  onConfirm,
}: BillingCheckoutWizardProps) {
  const [step, setStep] = useState(1);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedPlanData = plans.find((p) => p.id === selectedPlanId);

  const priceForPeriod = (
    p: (typeof plans)[0] | undefined,
    period: BillingPeriod,
  ) => {
    if (!p) return null;
    const fromMap = p.pricesByPeriod?.[period];
    if (typeof fromMap === "number" && Number.isFinite(fromMap)) return fromMap;
    return period === "monthly" ? p.price : null;
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    if (!selectedPlanId) return;
    setLoading(true);
    try {
      await onConfirm(selectedPlanId, billingPeriod);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Checkout" subtitle="Complete your plan upgrade">
      <div className="c360-mb-6">
        <div className="c360-wizard-step-row">
          {CHECKOUT_STEPS.map((label, i) => (
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
          <p className="c360-page-subtitle c360-mb-4">
            Choose the plan you want to upgrade to:
          </p>
          <RadioGroup
            name="billing-period"
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
            {plans
              .filter((p) => p.id !== effectivePlan)
              .map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPlan(p.id)}
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
                        if (typeof pr === "number")
                          return `$${pr.toFixed(2)}/${billingPeriod === "monthly" ? "mo" : billingPeriod === "quarterly" ? "qtr" : "yr"}`;
                        return typeof p.price === "number"
                          ? `$${p.price}/mo`
                          : "Custom";
                      })()}
                    </div>
                  </div>
                  {selectedPlanId === p.id && (
                    <CheckCircle size={18} color="var(--c360-primary)" />
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="c360-flex c360-gap-3 c360-mb-4">
            {["card", "bank_transfer"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={cn(
                  "c360-type-btn c360-p-4",
                  paymentMethod === m && "c360-type-btn--active",
                )}
              >
                {m === "card" ? "Credit / Debit Card" : "Bank Transfer"}
              </button>
            ))}
          </div>
          {paymentMethod === "card" && (
            <div className="c360-section-stack">
              <Input
                label="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
              <Input
                label="Cardholder Name"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Doe"
              />
              <div className="c360-form-grid">
                <Input
                  label="Expiry"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                />
                <Input
                  label="CVV"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
          )}
          {paymentMethod === "bank_transfer" && (
            <div className="c360-result-box c360-result-box--neutral">
              <p className="c360-page-subtitle">
                Use UPI or bank details from the Billing → Plans tab (payment
                instructions from your workspace), or complete payment proof
                there after transfer.
              </p>
            </div>
          )}
        </div>
      )}

      {step === 3 && selectedPlanData && (
        <div className="c360-text-center c360-billing-checkout-confirm-wrap">
          <div className="c360-billing-checkout-confirm-icon-circle">
            <Zap size={28} color="var(--c360-primary)" />
          </div>
          <h3 className="c360-billing-checkout-confirm-title">
            Confirm your upgrade
          </h3>
          <p className="c360-page-subtitle c360-mb-4">
            You&apos;re upgrading to <strong>{selectedPlanData.name}</strong>
            {priceForPeriod(selectedPlanData, billingPeriod) != null ? (
              <>
                {" "}
                (
                <strong>
                  {billingPeriod === "monthly"
                    ? "Monthly"
                    : billingPeriod === "quarterly"
                      ? "Quarterly"
                      : "Yearly"}
                </strong>
                ) for{" "}
                <strong>
                  ${priceForPeriod(selectedPlanData, billingPeriod)?.toFixed(2)}
                </strong>
              </>
            ) : selectedPlanData.price !== null ? (
              <>
                {" "}
                for <strong>${selectedPlanData.price}/month</strong>
              </>
            ) : (
              <> — pricing from your workspace admin.</>
            )}
          </p>
          <div className="c360-result-box c360-result-box--neutral c360-text-left c360-mb-4">
            {selectedPlanData.features.map((f) => (
              <div
                key={f}
                className="c360-flex c360-items-center c360-gap-2 c360-billing-checkout-feature-row"
              >
                <CheckCircle size={14} color="var(--c360-success)" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="c360-wizard-nav">
        {step > 1 && (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        )}
        <Button
          loading={loading}
          disabled={step === 1 && !selectedPlanId}
          onClick={handleNext}
        >
          {step === 3 ? "Confirm & Pay" : "Next"}
        </Button>
      </div>
    </Card>
  );
}

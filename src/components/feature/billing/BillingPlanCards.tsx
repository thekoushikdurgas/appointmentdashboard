"use client";

import type { ReactNode } from "react";
import { applyVars } from "@/lib/applyCssVars";
import { CheckCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type BillingPlanCard = {
  id: string;
  name: string;
  /** Default display price (typically monthly USD). */
  price: number | null;
  /** Prices from `billing.plans[].periods` for checkout period selection. */
  pricesByPeriod?: Partial<
    Record<"monthly" | "quarterly" | "yearly", number | undefined>
  >;
  /** Credits per period (for manual UPI checkout submission). */
  creditsByPeriod?: Partial<
    Record<"monthly" | "quarterly" | "yearly", number | undefined>
  >;
  features: string[];
  bg: string;
  color: string;
  icon: ReactNode;
  popular?: boolean;
};

interface BillingPlanCardsProps {
  plans: BillingPlanCard[];
  effectivePlan: string;
  onSelectPlan: (planId: string) => void;
  uploadingProof: boolean;
  onUploadProof: () => void;
}

export function BillingPlanCards({
  plans,
  effectivePlan,
  onSelectPlan,
}: BillingPlanCardsProps) {
  return (
    <div className="c360-plan-grid c360-mb-6">
      {plans.map((p) => (
        <div
          key={p.id}
          className={cn(
            "c360-card c360-billing-plan-card",
            p.id === effectivePlan && "c360-billing-plan-card--current",
          )}
        >
          {p.popular && (
            <div className="c360-billing-plan-popular-badge">
              <Badge color="blue">Most Popular</Badge>
            </div>
          )}
          <div className="c360-card__body">
            <div className="c360-flex c360-items-center c360-gap-3 c360-mb-4">
              <div
                className="c360-billing-plan-icon-wrap"
                ref={(el) =>
                  applyVars(el, {
                    "--c360-billing-plan-icon-bg": p.bg,
                    "--c360-billing-plan-icon-fg": p.color,
                  })
                }
              >
                {p.icon}
              </div>
              <div>
                <div className="c360-font-bold c360-text-body">{p.name}</div>
                <div className="c360-dropzone__hint">
                  {p.price === null
                    ? "Custom pricing"
                    : p.price === 0
                      ? "Free forever"
                      : `$${p.price}/mo`}
                </div>
              </div>
            </div>
            <ul className="c360-plan-card__features c360-mb-4">
              {p.features.map((f) => (
                <li key={f} className="c360-plan-card__feature">
                  <CheckCircle
                    size={14}
                    className="c360-text-success c360-flex-shrink-0"
                  />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant={p.id === effectivePlan ? "secondary" : "primary"}
              size="sm"
              className="c360-w-full"
              disabled={p.id === effectivePlan || p.price === null}
              onClick={() => {
                if (p.price === null) return;
                onSelectPlan(p.id);
              }}
              rightIcon={
                p.id !== effectivePlan && p.price !== null ? (
                  <ChevronRight size={14} />
                ) : undefined
              }
            >
              {p.id === effectivePlan
                ? "Current plan"
                : p.price === null
                  ? "Contact sales"
                  : "Upgrade"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

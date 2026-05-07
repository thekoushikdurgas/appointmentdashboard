"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { applyVars } from "@/lib/applyCssVars";
import { CheckCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { cn } from "@/lib/utils";

export type BillingPeriod = "monthly" | "quarterly" | "yearly";

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

const PERIOD_ORDER: BillingPeriod[] = ["monthly", "quarterly", "yearly"];

function periodLabel(p: BillingPeriod): string {
  if (p === "monthly") return "Monthly";
  if (p === "quarterly") return "Quarterly";
  return "Yearly";
}

export function availableBillingPeriods(
  plans: BillingPlanCard[],
): BillingPeriod[] {
  return PERIOD_ORDER.filter((k) =>
    plans.some((plan) => {
      const pr = plan.pricesByPeriod?.[k];
      if (typeof pr === "number" && Number.isFinite(pr)) return true;
      return (
        k === "monthly" && plan.price != null && Number.isFinite(plan.price)
      );
    }),
  );
}

function rawPriceForPeriod(
  p: BillingPlanCard,
  period: BillingPeriod,
): number | null {
  const from = p.pricesByPeriod?.[period];
  if (typeof from === "number" && Number.isFinite(from)) return from;
  if (period === "monthly" && p.price != null && Number.isFinite(p.price)) {
    return p.price;
  }
  return null;
}

function rawCreditsForPeriod(
  p: BillingPlanCard,
  period: BillingPeriod,
): number | null {
  const c = p.creditsByPeriod?.[period];
  if (typeof c === "number" && Number.isFinite(c)) return c;
  return null;
}

function normalizedPriceAmount(
  raw: number,
  period: BillingPeriod,
  basis: "perMonth" | "perYear",
): number {
  if (basis === "perMonth") {
    if (period === "monthly") return raw;
    if (period === "quarterly") return raw / 3;
    return raw / 12;
  }
  if (period === "monthly") return raw * 12;
  if (period === "quarterly") return raw * 4;
  return raw;
}

function normalizedCreditsAmount(
  raw: number,
  period: BillingPeriod,
  basis: "perMonth" | "perYear",
): number {
  if (basis === "perMonth") {
    if (period === "monthly") return raw;
    if (period === "quarterly") return raw / 3;
    return raw / 12;
  }
  if (period === "monthly") return raw * 12;
  if (period === "quarterly") return raw * 4;
  return raw;
}

function formatMoney(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return rounded % 1 === 0
    ? `$${rounded.toFixed(0)}`
    : `$${rounded.toFixed(2)}`;
}

interface BillingPlanCardsProps {
  plans: BillingPlanCard[];
  effectivePlan: string;
  onSelectPlan: (planId: string) => void;
  uploadingProof: boolean;
  onUploadProof: () => void;
  /** When set, billing cadence is controlled (e.g. synced with checkout). */
  billingPeriod?: BillingPeriod;
  onBillingPeriodChange?: (p: BillingPeriod) => void;
}

export function BillingPlanCards({
  plans,
  effectivePlan,
  onSelectPlan,
  uploadingProof: _uploadingProof,
  onUploadProof: _onUploadProof,
  billingPeriod: billingPeriodProp,
  onBillingPeriodChange,
}: BillingPlanCardsProps) {
  const [internalPeriod, setInternalPeriod] =
    useState<BillingPeriod>("monthly");
  const [priceBasisIdx, setPriceBasisIdx] = useState(0);

  const periodOptions = useMemo(() => availableBillingPeriods(plans), [plans]);

  const effectivePeriod =
    billingPeriodProp !== undefined ? billingPeriodProp : internalPeriod;

  const setEffectivePeriod = (next: BillingPeriod) => {
    if (billingPeriodProp === undefined) setInternalPeriod(next);
    onBillingPeriodChange?.(next);
  };

  useEffect(() => {
    if (!periodOptions.length) return;
    if (!periodOptions.includes(effectivePeriod)) {
      const fallback = periodOptions[0];
      if (billingPeriodProp === undefined) setInternalPeriod(fallback);
      onBillingPeriodChange?.(fallback);
    }
  }, [
    periodOptions,
    effectivePeriod,
    billingPeriodProp,
    onBillingPeriodChange,
  ]);

  const periodSliderMax = Math.max(0, periodOptions.length - 1);
  const periodSliderIdx = Math.max(0, periodOptions.indexOf(effectivePeriod));

  const basis: "perMonth" | "perYear" =
    priceBasisIdx >= 1 ? "perYear" : "perMonth";

  return (
    <section
      className="c360-billing-pricing"
      aria-labelledby="c360-billing-pricing-heading"
    >
      <header className="c360-billing-pricing__intro">
        <h2
          id="c360-billing-pricing-heading"
          className="c360-billing-pricing__title"
        >
          Choose your plan
        </h2>
        <p className="c360-billing-pricing__subtitle">
          Slide billing cadence (monthly, quarterly, or yearly), then compare
          prices on a per-month or per-year basis before you upgrade.
        </p>
      </header>

      <div className="c360-billing-pricing__sliders">
        {periodOptions.length > 1 ? (
          <>
            <RangeSlider
              className="c360-billing-pricing__slider"
              min={0}
              max={periodSliderMax}
              step={1}
              value={periodSliderIdx}
              onChange={(i) => {
                const next = periodOptions[i];
                if (next) setEffectivePeriod(next);
              }}
              label="Billing cadence"
              formatValue={(i) =>
                periodOptions[i] ? periodLabel(periodOptions[i]) : "—"
              }
              showTicks={false}
              aria-label="Billing cadence"
            />
            <div className="c360-billing-pricing__scale" aria-hidden>
              {periodOptions.map((opt) => (
                <span
                  key={opt}
                  className={cn(
                    "c360-billing-pricing__scale-item",
                    opt === effectivePeriod &&
                      "c360-billing-pricing__scale-item--active",
                  )}
                >
                  {periodLabel(opt)}
                </span>
              ))}
            </div>
          </>
        ) : periodOptions.length === 1 ? (
          <p className="c360-billing-pricing__single-period c360-text-sm c360-text-muted">
            Billing cadence:{" "}
            <strong className="c360-text-body">
              {periodLabel(periodOptions[0])}
            </strong>
          </p>
        ) : null}

        <RangeSlider
          className="c360-billing-pricing__slider c360-billing-pricing__slider--basis"
          min={0}
          max={1}
          step={1}
          value={priceBasisIdx}
          onChange={setPriceBasisIdx}
          label="Price view"
          formatValue={(v) => (v >= 1 ? "Per year" : "Per month")}
          aria-label="Normalize price per month or per year"
        />
      </div>

      <div className="c360-billing-pricing__grid">
        {plans.map((p) => {
          const raw = rawPriceForPeriod(p, effectivePeriod);
          const popular = Boolean(p.popular);
          const priceDisplay =
            p.price === null
              ? { headline: "Custom", sub: "Contact sales for a quote" }
              : raw == null
                ? {
                    headline: "—",
                    sub: `No ${periodLabel(effectivePeriod).toLowerCase()} price`,
                  }
                : (() => {
                    const n = normalizedPriceAmount(
                      raw,
                      effectivePeriod,
                      basis,
                    );
                    const suffix = basis === "perMonth" ? "/mo" : "/yr";
                    const billed = periodLabel(effectivePeriod);
                    return {
                      headline: `${formatMoney(n)}${suffix}`,
                      sub: `Billed ${billed.toLowerCase()} · ${formatMoney(raw)} per term`,
                    };
                  })();

          const rawCr = rawCreditsForPeriod(p, effectivePeriod);
          const creditsLine =
            rawCr != null
              ? `${Math.round(normalizedCreditsAmount(rawCr, effectivePeriod, basis)).toLocaleString()} credits ${basis === "perMonth" ? "/ mo equiv." : "/ yr equiv."}`
              : null;

          return (
            <div
              key={p.id}
              className={cn(
                "c360-billing-pricing-card",
                popular && "c360-billing-pricing-card--popular",
                p.id === effectivePlan && "c360-billing-pricing-card--current",
              )}
            >
              {popular && (
                <div className="c360-billing-pricing-card__ribbon">
                  <Badge color="blue">Most popular</Badge>
                </div>
              )}
              <div className="c360-billing-pricing-card__inner">
                <div className="c360-billing-pricing-card__badge-name">
                  <Badge color="gray">{p.name}</Badge>
                </div>
                <div
                  className="c360-billing-pricing-card__icon"
                  ref={(el) =>
                    applyVars(el, {
                      "--c360-billing-plan-icon-bg": p.bg,
                      "--c360-billing-plan-icon-fg": p.color,
                    })
                  }
                >
                  {p.icon}
                </div>
                <p className="c360-billing-pricing-card__price">
                  {priceDisplay.headline}
                </p>
                {priceDisplay.sub && (
                  <p className="c360-billing-pricing-card__price-sub c360-text-muted">
                    {priceDisplay.sub}
                  </p>
                )}
                {creditsLine && (
                  <p className="c360-billing-pricing-card__credits-hint c360-text-sm">
                    {creditsLine}
                  </p>
                )}
                <div className="c360-billing-pricing-card__rule" />
                <ul className="c360-billing-pricing-card__features">
                  {p.features.map((f) => (
                    <li key={f} className="c360-billing-pricing-card__feature">
                      <CheckCircle
                        size={14}
                        className="c360-billing-pricing-card__check"
                        aria-hidden
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={p.id === effectivePlan ? "secondary" : "primary"}
                  size="sm"
                  className="c360-billing-pricing-card__cta"
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
          );
        })}
      </div>
    </section>
  );
}

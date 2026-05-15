"use client";

import Link from "next/link";
import { useId } from "react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** Decorative pill strip (same pattern as database coming soon; not routes). */
const PILL_LABELS = [
  "Analytics",
  "Workspace",
  "Professional",
  "Plans",
  "Upgrade",
] as const;
const PILL_HIGHLIGHT_INDEX = 2;

const PLANS_BTN_CLASS = cn(
  "c360-btn",
  "c360-btn--primary",
  "c360-database-soon__btn-waitlist",
  "c360-database-soon__cta",
  "c360-database-soon__cta-wide",
);

function ProGatePillStrip() {
  return (
    <div
      className="c360-database-soon__pills-outer"
      role="presentation"
      aria-hidden="true"
    >
      <div className="c360-database-soon__pills">
        {PILL_LABELS.map((label, index) => (
          <span
            key={label}
            className={cn(
              "c360-database-soon__pill",
              index === PILL_HIGHLIGHT_INDEX &&
                "c360-database-soon__pill--active",
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface ProfessionalFeatureGateProps {
  /** Surface name shown as the main headline (e.g. Demands & Trends). */
  featureName: string;
  /** Body copy; defaults to plan + admin availability sentence. */
  description?: string;
  plansHref?: string;
  plansLabel?: string;
}

/**
 * Full-height dashboard gate with the same shell + glass card pattern as
 * {@link DatabaseModuleComingSoon} (see `28-database-coming-soon.css`).
 */
export function ProfessionalFeatureGate({
  featureName,
  description,
  plansHref = ROUTES.BILLING,
  plansLabel = "View plans",
}: ProfessionalFeatureGateProps) {
  const headingId = useId().replace(/:/g, "");
  const titleId = `c360-pro-gate-title-${headingId}`;
  const sectionId = `c360-pro-gate-section-${headingId}`;

  const blurb =
    description ??
    `${featureName} is available on Professional plans and for admins.`;

  return (
    <DashboardPageLayout className="c360-database-soon">
      <div className="c360-database-soon__column">
        <ProGatePillStrip />

        <section
          id={sectionId}
          aria-labelledby={titleId}
          className="c360-database-soon__card-wrap"
        >
          <div className="c360-database-soon__card-halo" aria-hidden />
          <div className="c360-database-soon__card">
            <div className="c360-database-soon__card-shine" aria-hidden />

            <div className="c360-database-soon__body">
              <p className="c360-database-soon__eyebrow">
                Professional feature
              </p>
              <h1 id={titleId} className="c360-database-soon__title">
                {featureName}
              </h1>
              <p className="c360-database-soon__blurb">{blurb}</p>

              <Button asChild variant="primary" className={PLANS_BTN_CLASS}>
                <Link href={plansHref}>{plansLabel}</Link>
              </Button>
            </div>

            <div
              className="c360-database-soon__card-footer-shine"
              aria-hidden
            />
          </div>
        </section>
      </div>
    </DashboardPageLayout>
  );
}

"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const DEFAULT_DESCRIPTION =
  "This filter is not available on your account yet. Contact your admin or upgrade your plan for early access when it launches.";

function resolveDescription(
  description: string | undefined,
  featureLabel: string | undefined,
): string {
  if (description) return description;
  if (featureLabel) {
    return `${featureLabel} filtering is not available on your account yet. Contact your admin or upgrade your plan for early access when it launches.`;
  }
  return DEFAULT_DESCRIPTION;
}

export interface HiringSignalFilterComingSoonProps {
  title?: string;
  /** Overrides auto-generated copy from `featureLabel`. */
  description?: string;
  /** e.g. "Industry", "Employee size" — used when `description` is omitted. */
  featureLabel?: string;
  showPlansLink?: boolean;
}

/**
 * Compact “coming soon” placeholder inside a hiring-signals filter section.
 */
export function HiringSignalFilterComingSoon({
  title = "Coming soon",
  description,
  featureLabel,
  showPlansLink = true,
}: HiringSignalFilterComingSoonProps) {
  const blurb = resolveDescription(description, featureLabel);
  return (
    <div className="c360-hs-filter-coming-soon" role="status">
      <p className="c360-hs-filter-coming-soon__eyebrow">{title}</p>
      <p className="c360-hs-filter-coming-soon__text">{blurb}</p>
      {showPlansLink ? (
        <Link
          href={ROUTES.BILLING}
          className="c360-hs-filter-coming-soon__link"
        >
          View plans
        </Link>
      ) : null}
    </div>
  );
}

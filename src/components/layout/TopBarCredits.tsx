"use client";

import Link from "next/link";
import { useRole } from "@/context/RoleContext";
import { ROUTES } from "@/lib/constants";

interface TopBarCreditsProps {
  /** e.g. close mobile sidebar when navigating to Billing */
  onNavigate?: () => void;
}

/** Credits + Billing block for the account popover in the top bar. */
export function TopBarCredits({ onNavigate }: TopBarCreditsProps) {
  const { credits, creditsUsed, creditsLimit } = useRole();

  const pct =
    creditsLimit > 0
      ? Math.min(100, Math.round((creditsUsed / creditsLimit) * 100))
      : null;

  return (
    <div className="c360-topbar__credits c360-topbar__credits--popover">
      <div className="c360-topbar__credits-head">
        <span className="c360-topbar__credits-label">Credits</span>
        <Link
          href={ROUTES.BILLING}
          className="c360-topbar__credits-link"
          onClick={() => onNavigate?.()}
        >
          Billing
        </Link>
      </div>
      {creditsLimit > 0 && pct !== null ? (
        <>
          <progress
            className="c360-topbar__credits-bar"
            max={100}
            value={pct}
            aria-label={`${pct}% credits used`}
          />
          <div className="c360-topbar__credits-meta">
            <span className="c360-topbar__credits-usage">
              {creditsUsed.toLocaleString()} / {creditsLimit.toLocaleString()}{" "}
              used
            </span>
            <span className="c360-topbar__credits-badge">{pct}%</span>
          </div>
        </>
      ) : (
        <div className="c360-topbar__credits-meta">
          <span>{credits.toLocaleString()} remaining</span>
        </div>
      )}
    </div>
  );
}

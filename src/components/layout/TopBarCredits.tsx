"use client";

import { useRole } from "@/context/RoleContext";

export type TopBarCreditsVariant = "popover" | "sidebar";

export interface TopBarCreditsProps {
  variant?: TopBarCreditsVariant;
}

/** Credits summary in the account context menu panel or sidebar footer. */
export function TopBarCredits({ variant = "popover" }: TopBarCreditsProps) {
  const { credits, creditsUsed, creditsLimit, addonCredits } = useRole();

  const pct =
    creditsLimit > 0
      ? Math.min(100, Math.round((creditsUsed / creditsLimit) * 100))
      : null;

  return (
    <div
      className={
        variant === "sidebar"
          ? "c360-topbar__credits c360-topbar__credits--sidebar"
          : "c360-topbar__credits c360-topbar__credits--popover"
      }
    >
      <div className="c360-topbar__credits-head">
        <span className="c360-topbar__credits-label">Credits</span>
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
              daily used
            </span>
            <span className="c360-topbar__credits-badge">{pct}%</span>
          </div>
          {addonCredits > 0 ? (
            <div className="c360-topbar__credits-meta">
              <span className="c360-topbar__credits-usage">
                +{addonCredits.toLocaleString()} addon credits
              </span>
            </div>
          ) : null}
        </>
      ) : (
        <div className="c360-topbar__credits-meta">
          <span>{credits.toLocaleString()} remaining</span>
        </div>
      )}
    </div>
  );
}

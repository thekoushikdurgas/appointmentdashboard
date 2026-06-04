export type PlanPeriodLike = {
  credits: number;
  dailyCreditsLimit?: number;
};

/** Prefer API daily cap; fall back to period bundle credits when unset. */
export function displayDailyCreditsFromPeriod(
  period: PlanPeriodLike | null | undefined,
): number | null {
  if (!period) return null;
  if (
    typeof period.dailyCreditsLimit === "number" &&
    period.dailyCreditsLimit > 0
  ) {
    return period.dailyCreditsLimit;
  }
  if (typeof period.credits === "number" && period.credits > 0) {
    return period.credits;
  }
  return null;
}

export function formatBillingWalletSummary(b: {
  credits: number;
  addonCredits?: number;
}): string {
  const addon = b.addonCredits ?? 0;
  if (addon > 0) {
    return `${b.credits.toLocaleString()} daily · +${addon.toLocaleString()} addon`;
  }
  return `${b.credits.toLocaleString()} daily remaining`;
}

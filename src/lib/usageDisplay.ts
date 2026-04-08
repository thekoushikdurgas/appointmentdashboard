import type { FeatureUsageInfo } from "@/graphql/generated/types";

export function isUsageUnlimited(
  info: Pick<FeatureUsageInfo, "limit" | "remaining">,
): boolean {
  return info.remaining === -1 || info.limit >= 999999;
}

export function usageProgressPercent(info: FeatureUsageInfo): number {
  if (isUsageUnlimited(info)) return 100;
  const denom = Math.max(info.limit, 1);
  return Math.min((info.used / denom) * 100, 100);
}

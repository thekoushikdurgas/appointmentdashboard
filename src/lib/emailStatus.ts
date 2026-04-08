import type { BadgeColor } from "@/components/ui/Badge";

/** Map verifier / finder status strings to dashboard badge colors. */
export function emailVerifyBadgeColor(status: string): BadgeColor {
  const s = status.toLowerCase();
  if (s === "valid" || s === "ok") return "success";
  if (s === "invalid") return "danger";
  if (s === "catchall") return "warning";
  if (s === "risky") return "orange";
  if (s === "unknown") return "gray";
  return "info";
}

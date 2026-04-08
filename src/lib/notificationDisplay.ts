import type {
  GraphQlNotificationPriority,
  GraphQlNotificationType,
} from "@/graphql/generated/types";

/** Normalize API strings (e.g. lowercase) to canonical enum keys for UI. */
export function normalizeNotificationType(
  raw: string,
): GraphQlNotificationType | string {
  const u = raw.trim().toUpperCase();
  const allowed: GraphQlNotificationType[] = [
    "SYSTEM",
    "SECURITY",
    "ACTIVITY",
    "MARKETING",
    "BILLING",
  ];
  return allowed.includes(u as GraphQlNotificationType)
    ? (u as GraphQlNotificationType)
    : u;
}

export function normalizeNotificationPriority(
  raw: string,
): GraphQlNotificationPriority | string {
  const u = raw.trim().toUpperCase();
  const allowed: GraphQlNotificationPriority[] = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
  ];
  return allowed.includes(u as GraphQlNotificationPriority)
    ? (u as GraphQlNotificationPriority)
    : u;
}

export type PriorityBadgeColor = "red" | "yellow" | "blue" | "gray" | "orange";

export function priorityToBadgeColor(
  priority: GraphQlNotificationPriority | string,
): PriorityBadgeColor {
  const p =
    typeof priority === "string"
      ? normalizeNotificationPriority(priority)
      : priority;
  switch (p) {
    case "URGENT":
    case "HIGH":
      return "red";
    case "MEDIUM":
      return "yellow";
    case "LOW":
      return "blue";
    default:
      return "gray";
  }
}

export function typeToBadgeColor(
  type: GraphQlNotificationType | string,
): "blue" | "green" | "orange" | "purple" | "gray" {
  const t = typeof type === "string" ? normalizeNotificationType(type) : type;
  switch (t) {
    case "SECURITY":
      return "orange";
    case "BILLING":
      return "purple";
    case "MARKETING":
      return "green";
    case "ACTIVITY":
      return "blue";
    case "SYSTEM":
    default:
      return "gray";
  }
}

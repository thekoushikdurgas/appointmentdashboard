"use client";

import type { GraphQlNotificationType } from "@/graphql/generated/types";
import { cn } from "@/lib/utils";

export type NotificationTypeFilterValue = GraphQlNotificationType | "ALL";

const OPTIONS: { value: NotificationTypeFilterValue; label: string }[] = [
  { value: "ALL", label: "All types" },
  { value: "SYSTEM", label: "System" },
  { value: "SECURITY", label: "Security" },
  { value: "ACTIVITY", label: "Activity" },
  { value: "MARKETING", label: "Marketing" },
  { value: "BILLING", label: "Billing" },
];

export interface NotificationTypeFilterProps {
  value: NotificationTypeFilterValue;
  onChange: (v: NotificationTypeFilterValue) => void;
  disabled?: boolean;
}

export function NotificationTypeFilter({
  value,
  onChange,
  disabled,
}: NotificationTypeFilterProps) {
  return (
    <div
      className="c360-flex c360-flex-wrap c360-gap-2"
      role="group"
      aria-label="Filter by notification type"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          className={cn(
            "c360-btn c360-btn--sm",
            value === opt.value ? "c360-btn--primary" : "c360-btn--secondary",
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

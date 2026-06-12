"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterChipItem = {
  key: string;
  label: string;
  onRemove: () => void;
};

export function pickFilterChipsByKeyPrefix(
  items: FilterChipItem[],
  prefixes: readonly string[],
): FilterChipItem[] {
  if (prefixes.length === 0) return [];
  return items.filter((c) => prefixes.some((p) => c.key.startsWith(p)));
}

export function FilterChipList({
  items,
  variant = "default",
  className,
  ariaLabel,
}: {
  items: FilterChipItem[];
  variant?: "default" | "section";
  className?: string;
  ariaLabel?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        "c360-entity-filters__chips",
        variant === "section" && "c360-entity-filters__chips--section",
        className,
      )}
      role="list"
      aria-label={ariaLabel}
    >
      {items.map((c) => (
        <span key={c.key} className="c360-entity-filters__chip" role="listitem">
          <span className="c360-entity-filters__chip-text">{c.label}</span>
          <button
            type="button"
            className="c360-entity-filters__chip-remove"
            aria-label={`Remove ${c.label}`}
            onClick={c.onRemove}
          >
            <X size={12} aria-hidden />
          </button>
        </span>
      ))}
    </div>
  );
}

"use client";

import { Loader2 } from "lucide-react";
import { formatCompact } from "@/lib/utils";

export type SavedSearchCohortCountEntry =
  | { status: "loading" }
  | { status: "ready"; value: number }
  | { status: "error" };

const LABELS = {
  contact: {
    singular: "contact",
    plural: "contacts",
    loading: "Counting contacts…",
    error: "Contact count unavailable",
  },
  company: {
    singular: "company",
    plural: "companies",
    loading: "Counting companies…",
    error: "Company count unavailable",
  },
} as const;

export function SavedSearchCohortCount({
  entry,
  kind,
}: {
  entry?: SavedSearchCohortCountEntry;
  kind: keyof typeof LABELS;
}) {
  const labels = LABELS[kind];

  if (!entry || entry.status === "loading") {
    return (
      <span className="c360-saved-searches-panel__item-count c360-saved-searches-panel__item-count--loading">
        <Loader2 className="c360-spin" size={12} aria-hidden />
        {labels.loading}
      </span>
    );
  }
  if (entry.status === "error") {
    return (
      <span className="c360-saved-searches-panel__item-count c360-saved-searches-panel__item-count--muted">
        {labels.error}
      </span>
    );
  }
  const n = entry.value;
  const label = n === 1 ? labels.singular : labels.plural;
  return (
    <span className="c360-saved-searches-panel__item-count">
      <span className="c360-saved-searches-panel__item-count-value">
        {formatCompact(n)}
      </span>
      {label}
    </span>
  );
}

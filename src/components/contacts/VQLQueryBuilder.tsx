"use client";

import { VqlBuilderModal } from "@/components/vql/VqlBuilderModal";
import { legacyVqlQueryToDraft, type DraftQuery } from "@/lib/vqlDraft";

export interface VQLCondition {
  field: string;
  operator: string;
  value: string | null;
}

export interface VQLFilters {
  and?: Array<VQLCondition | VQLFilters>;
  or?: Array<VQLCondition | VQLFilters>;
}

export interface VQLQuery {
  filters?: VQLFilters;
}

export interface VQLQueryBuilderProps {
  open: boolean;
  onClose: () => void;
  onApply: (query: VQLQuery) => void;
  initialQuery?: VQLQuery | null;
}

function draftToLegacyQuery(draft: DraftQuery): VQLQuery {
  const items: VQLCondition[] = [];
  for (const it of draft.rootGroup.items) {
    if ("field" in it && it.field.trim()) {
      items.push({
        field: it.field,
        operator: it.operator,
        value: it.value.trim() || null,
      });
    }
  }
  if (draft.rootGroup.logic === "or") {
    return { filters: { or: items } };
  }
  return { filters: { and: items } };
}

/**
 * @deprecated Prefer {@link VqlBuilderModal} + {@link draftToVqlQueryInput}.
 * Thin wrapper for legacy callers that still expect {@link VQLQuery}.
 */
export function VQLQueryBuilder({
  open,
  onClose,
  onApply,
  initialQuery,
}: VQLQueryBuilderProps) {
  return (
    <VqlBuilderModal
      open={open}
      onClose={onClose}
      entityType="contact"
      initialDraft={legacyVqlQueryToDraft(initialQuery ?? null)}
      onApply={(draft) => {
        onApply(draftToLegacyQuery(draft));
      }}
    />
  );
}

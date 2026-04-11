"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  emptyDraftQuery,
  draftToVqlQueryInput,
  draftHasBuilderPayload,
  type DraftQuery,
} from "@/lib/vqlDraft";
import type { VqlQueryInput } from "@/graphql/generated/types";
import { VqlGroupEditor } from "./VqlFormParts";
import { VqlSortEditor } from "./VqlSortEditor";
import { VqlColumnPicker } from "./VqlColumnPicker";
import { VqlQueryPreview } from "./VqlQueryPreview";

type Tab = "filter" | "sort" | "columns" | "preview";

export interface VqlBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (draft: DraftQuery) => void;
  entityType: "contact" | "company";
  initialDraft?: DraftQuery | null;
}

export function VqlBuilderModal({
  open,
  onClose,
  onApply,
  entityType,
  initialDraft,
}: VqlBuilderModalProps) {
  const [tab, setTab] = useState<Tab>("filter");
  const [draft, setDraft] = useState<DraftQuery>(() => emptyDraftQuery());

  useEffect(() => {
    if (!open) return;
    setTab("filter");
    if (initialDraft) {
      setDraft(structuredClone(initialDraft));
    } else {
      setDraft(emptyDraftQuery());
    }
  }, [open, initialDraft]);

  const previewQuery = useMemo(
    () => draftToVqlQueryInput(draft, entityType) as Partial<VqlQueryInput>,
    [draft, entityType],
  );

  const canApply = draftHasBuilderPayload(draft);

  const handleApply = () => {
    onApply(structuredClone(draft));
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Advanced VQL"
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDraft(emptyDraftQuery())}
          >
            Clear all
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!canApply}>
            Apply
          </Button>
        </>
      }
    >
      <div className="c360-vql-tabs c360-flex c360-gap-1 c360-mb-4 c360-border-b">
        {(
          [
            ["filter", "Filter"],
            ["sort", "Sort"],
            ["columns", "Columns"],
            ["preview", "Preview"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={
              tab === k
                ? "c360-pb-2 c360-px-2 c360-border-b-2 c360-font-medium"
                : "c360-pb-2 c360-px-2 c360-text-muted"
            }
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "filter" ? (
        <VqlGroupEditor
          group={draft.rootGroup}
          onChange={(g) => setDraft({ ...draft, rootGroup: g })}
          entityType={entityType}
        />
      ) : null}
      {tab === "sort" ? (
        <VqlSortEditor
          sort={draft.sort}
          onChange={(s) => setDraft({ ...draft, sort: s })}
          entityType={entityType}
        />
      ) : null}
      {tab === "columns" ? (
        <VqlColumnPicker
          entityType={entityType}
          selected={draft.selectColumns}
          onChange={(cols) => setDraft({ ...draft, selectColumns: cols })}
          companyPopulate={draft.companyPopulate}
          companySelectColumns={draft.companySelectColumns}
          onCompanyPopulateChange={(pop, cols) =>
            setDraft({
              ...draft,
              companyPopulate: pop,
              companySelectColumns: cols,
            })
          }
        />
      ) : null}
      {tab === "preview" ? <VqlQueryPreview query={previewQuery} /> : null}
    </Modal>
  );
}

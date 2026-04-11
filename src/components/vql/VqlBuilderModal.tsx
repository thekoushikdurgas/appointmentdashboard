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
      <div
        role="tablist"
        aria-label="VQL builder sections"
        className="c360-vql-tabs c360-flex c360-gap-1 c360-mb-4 c360-border-b"
      >
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
            role="tab"
            aria-selected={tab === k ? "true" : "false"}
            id={`c360-vql-tab-${k}`}
            aria-controls={`c360-vql-panel-${k}`}
            className={`c360-vql-tab ${tab === k ? "c360-vql-tab--active" : "c360-vql-tab--inactive"}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="c360-vql-panel-filter"
        aria-labelledby="c360-vql-tab-filter"
        hidden={tab !== "filter"}
      >
        {tab === "filter" ? (
          <VqlGroupEditor
            group={draft.rootGroup}
            onChange={(g) => setDraft({ ...draft, rootGroup: g })}
            entityType={entityType}
          />
        ) : null}
      </div>
      <div
        role="tabpanel"
        id="c360-vql-panel-sort"
        aria-labelledby="c360-vql-tab-sort"
        hidden={tab !== "sort"}
      >
        {tab === "sort" ? (
          <VqlSortEditor
            sort={draft.sort}
            onChange={(s) => setDraft({ ...draft, sort: s })}
            entityType={entityType}
          />
        ) : null}
      </div>
      <div
        role="tabpanel"
        id="c360-vql-panel-columns"
        aria-labelledby="c360-vql-tab-columns"
        hidden={tab !== "columns"}
      >
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
      </div>
      <div
        role="tabpanel"
        id="c360-vql-panel-preview"
        aria-labelledby="c360-vql-tab-preview"
        hidden={tab !== "preview"}
      >
        {tab === "preview" ? <VqlQueryPreview query={previewQuery} /> : null}
      </div>
    </Modal>
  );
}

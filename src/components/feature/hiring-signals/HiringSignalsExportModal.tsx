"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import { hiringSignalRowKey } from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { EXPORT_DRAWER_DISPLAY_NAME } from "@/lib/jobs/exportDrawerUi";
import { HIRING_SIGNALS_PAGE_NAME } from "@/lib/productNames";
import { cn } from "@/lib/utils";

export type HiringSignalsExportIntent =
  | { scope: "selected"; linkedinJobIds: string[] }
  | { scope: "first_n"; n: number }
  | { scope: "all_matching" };

export interface HiringSignalsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: LinkedInJobRow[];
  totalMatching: number;
  selectedKeys: Set<string>;
  defaultFirstN?: number;
  /** Max LinkedIn job ids per export for this user (400 non-staff; very large for admin). */
  maxExportJobIds: number;
  /** Admin / SuperAdmin — UI does not cap N / all-matching below account limits. */
  staffExport?: boolean;
  busy?: boolean;
  onConfirm: (intent: HiringSignalsExportIntent) => void | Promise<void>;
}

function linkedinIdsFromRows(rows: LinkedInJobRow[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const id = (r.linkedinJobId || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function HiringSignalsExportModal({
  isOpen,
  onClose,
  jobs,
  totalMatching,
  selectedKeys,
  defaultFirstN = 25,
  maxExportJobIds,
  staffExport = false,
  busy = false,
  onConfirm,
}: HiringSignalsExportModalProps) {
  const [scope, setScope] = useState<"selected" | "first_n" | "all_matching">(
    "selected",
  );
  const [firstNInput, setFirstNInput] = useState(String(defaultFirstN));

  const selectedRows = useMemo(
    () => jobs.filter((r) => selectedKeys.has(hiringSignalRowKey(r))),
    [jobs, selectedKeys],
  );
  const selectedIds = useMemo(
    () => linkedinIdsFromRows(selectedRows),
    [selectedRows],
  );

  const effectiveMaxRows = staffExport
    ? Math.max(totalMatching, 1)
    : Math.min(Math.max(totalMatching, 1), maxExportJobIds);

  const firstNParsed = Number.parseInt(firstNInput.trim(), 10);
  const firstNN =
    Number.isFinite(firstNParsed) && firstNParsed >= 1
      ? Math.min(Math.floor(firstNParsed), effectiveMaxRows)
      : Math.min(defaultFirstN, effectiveMaxRows);

  const selectedDisabled = selectedIds.length === 0;
  const queueDisabled =
    busy || totalMatching === 0 || (scope === "selected" && selectedDisabled);

  const submit = async () => {
    if (scope === "selected") {
      await onConfirm({ scope: "selected", linkedinJobIds: selectedIds });
      return;
    }
    if (scope === "first_n") {
      await onConfirm({ scope: "first_n", n: firstNN });
      return;
    }
    await onConfirm({ scope: "all_matching" });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !busy && onClose()}
      title="Export hiring signals"
      size="sm"
      footer={
        <div className="c360-modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => !busy && onClose()}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={busy}
            leftIcon={<Download size={14} />}
            disabled={queueDisabled}
            onClick={() => void submit()}
          >
            Queue export
          </Button>
        </div>
      }
    >
      <div className="c360-space-y-4">
        <p className="c360-m-0 c360-text-2xs c360-text-ink-muted">
          Queue an XLSX export on the server (track in {EXPORT_DRAWER_DISPLAY_NAME} → {HIRING_SIGNALS_PAGE_NAME}).
        </p>
        <fieldset className="c360-m-0 c360-space-y-3 c360-border-0 c360-p-0">
          <legend className="c360-mb-2 c360-text-sm c360-font-medium c360-text-ink">
            What to include
          </legend>

          <label
            className={cn(
              "c360-flex c360-cursor-pointer c360-items-start c360-gap-2 c360-rounded c360-border c360-p-3",
              scope === "selected"
                ? "c360-border-primary c360-bg-primary/5"
                : "c360-border-ink-8",
              selectedDisabled && "c360-opacity-60",
            )}
          >
            <input
              type="radio"
              name="hs-export-scope"
              className="c360-mt-1"
              checked={scope === "selected"}
              disabled={selectedDisabled}
              onChange={() => setScope("selected")}
            />
            <span>
              <span className="c360-font-medium c360-text-ink">
                Selected rows
              </span>
              <span className="c360-mt-0-5 c360-block c360-text-2xs c360-text-muted">
                {selectedDisabled
                  ? "Select rows in the table using the checkboxes."
                  : !staffExport && selectedIds.length > maxExportJobIds
                    ? `${selectedIds.length} row(s) with LinkedIn job ids — only the first ${maxExportJobIds.toLocaleString()} will be exported per account limit.`
                    : `${selectedIds.length} row(s) with LinkedIn job ids.`}
              </span>
            </span>
          </label>

          <label
            className={cn(
              "c360-flex c360-cursor-pointer c360-items-start c360-gap-2 c360-rounded c360-border c360-p-3",
              scope === "first_n"
                ? "c360-border-primary c360-bg-primary/5"
                : "c360-border-ink-8",
            )}
          >
            <input
              type="radio"
              name="hs-export-scope"
              className="c360-mt-1"
              checked={scope === "first_n"}
              onChange={() => setScope("first_n")}
            />
            <span className="c360-grow">
              <span className="c360-font-medium c360-text-ink">
                First N matching rows
              </span>
              <span className="c360-mt-0-5 c360-block c360-text-2xs c360-text-muted">
                Same order as the server list for your current filters. Up to{" "}
                {effectiveMaxRows.toLocaleString()} rows available
                {staffExport
                  ? "."
                  : ` (max ${maxExportJobIds.toLocaleString()} per export).`}
              </span>
              {scope === "first_n" ? (
                <div className="c360-mt-2">
                  <Input
                    label="N"
                    type="number"
                    min={1}
                    max={effectiveMaxRows}
                    value={firstNInput}
                    onChange={(e) => setFirstNInput(e.target.value)}
                    inputSize="sm"
                  />
                </div>
              ) : null}
            </span>
          </label>

          <label
            className={cn(
              "c360-flex c360-cursor-pointer c360-items-start c360-gap-2 c360-rounded c360-border c360-p-3",
              scope === "all_matching"
                ? "c360-border-primary c360-bg-primary/5"
                : "c360-border-ink-8",
            )}
          >
            <input
              type="radio"
              name="hs-export-scope"
              className="c360-mt-1"
              checked={scope === "all_matching"}
              onChange={() => setScope("all_matching")}
            />
            <span>
              <span className="c360-font-medium c360-text-ink">
                All matching results
              </span>
              <span className="c360-mt-0-5 c360-block c360-text-2xs c360-text-muted">
                {staffExport
                  ? "Every row matching current filters (no account export cap)."
                  : `Up to ${maxExportJobIds.toLocaleString()} jobs per export for your account. Narrow filters or run multiple exports to cover more rows.`}
              </span>
            </span>
          </label>
        </fieldset>
      </div>
    </Modal>
  );
}

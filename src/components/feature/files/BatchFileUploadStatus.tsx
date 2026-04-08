"use client";

import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { cn, formatFileSize } from "@/lib/utils";

export type BatchFileRowStatus =
  | "pending"
  | "uploading"
  | "done"
  | "error"
  | "incomplete"
  | "cancelled";

export type BatchFileRow = {
  id: string;
  name: string;
  sizeBytes: number;
  status: BatchFileRowStatus;
  uploadedBytes: number;
  totalBytes: number;
  partNumber: number;
  numParts: number;
  errorMessage?: string;
};

function statusBadgeColor(
  s: BatchFileRowStatus,
): "blue" | "green" | "red" | "gray" | "warning" {
  switch (s) {
    case "done":
      return "green";
    case "uploading":
      return "blue";
    case "error":
      return "red";
    case "incomplete":
    case "cancelled":
      return "warning";
    default:
      return "gray";
  }
}

function statusLabel(s: BatchFileRowStatus): string {
  switch (s) {
    case "pending":
      return "Pending";
    case "uploading":
      return "Uploading";
    case "done":
      return "Done";
    case "error":
      return "Error";
    case "incomplete":
      return "Not uploaded";
    case "cancelled":
      return "Cancelled";
    default:
      return s;
  }
}

export interface BatchFileUploadStatusProps {
  rows: BatchFileRow[];
  /** Sum of bytes across the batch (current file partial + completed files). */
  overallValue: number;
  overallMax: number;
  busy: boolean;
  /** e.g. "Part 3 / 12 — current file chunks" */
  chunkHint?: string | null;
  overallLabel?: string;
  /** Optional extra content rendered at the end of each row (e.g. cancel button). */
  renderRowExtra?: (row: BatchFileRow, index: number) => React.ReactNode;
}

export function BatchFileUploadStatus({
  rows,
  overallValue,
  overallMax,
  busy,
  chunkHint,
  overallLabel = "Overall progress (all files & parts)",
  renderRowExtra,
}: BatchFileUploadStatusProps) {
  if (rows.length === 0) return null;

  return (
    <div className="c360-section-stack c360-gap-3 c360-mt-3">
      {busy && (
        <div className="c360-section-stack c360-gap-2">
          {chunkHint ? (
            <p className="c360-text-sm c360-text-muted c360-m-0" role="status">
              {chunkHint}
            </p>
          ) : null}
          <Progress
            value={overallValue}
            max={Math.max(overallMax, 1)}
            showValue
            label={overallLabel}
            indeterminate={false}
          />
        </div>
      )}

      <div className="c360-batch-upload-status">
        <div className="c360-text-xs c360-text-muted c360-mb-2 c360-font-medium">
          Per file
        </div>
        <ul className="c360-m-0 c360-p-0 c360-section-stack c360-gap-2 list-none">
          {rows.map((r, idx) => (
            <li
              key={r.id}
              className={cn(
                "c360-rounded-md c360-border c360-p-2 c360-text-sm",
                r.status === "uploading" &&
                  "c360-border-primary/40 c360-bg-primary/5",
                r.status === "error" &&
                  "c360-border-danger/50 c360-bg-danger/5",
              )}
            >
              <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2 c360-justify-between">
                <span className="c360-font-medium c360-truncate c360-max-w-[min(100%,18rem)]">
                  {r.name}
                </span>
                <div className="c360-flex c360-items-center c360-gap-1">
                  <Badge color={statusBadgeColor(r.status)} size="sm">
                    {statusLabel(r.status)}
                  </Badge>
                  {renderRowExtra?.(r, idx)}
                </div>
              </div>
              <div className="c360-text-xs c360-text-muted c360-mt-1">
                {formatFileSize(r.sizeBytes)}
                {r.status === "uploading" &&
                  r.numParts > 0 &&
                  ` · Part ${r.partNumber} / ${r.numParts}`}
                {r.status === "uploading" &&
                  r.totalBytes > 0 &&
                  ` · ${formatFileSize(r.uploadedBytes)} / ${formatFileSize(r.totalBytes)}`}
                {r.status === "done" && " · 100%"}
              </div>
              {r.status === "uploading" && r.totalBytes > 0 && (
                <div className="c360-mt-2">
                  <Progress
                    value={r.uploadedBytes}
                    max={Math.max(r.totalBytes, 1)}
                    size="sm"
                    showValue
                    indeterminate={false}
                  />
                </div>
              )}
              {r.status === "error" && r.errorMessage && (
                <p className="c360-m-0 c360-mt-2 c360-text-xs c360-text-danger">
                  {r.errorMessage}
                </p>
              )}
              {r.status === "incomplete" && (
                <p className="c360-m-0 c360-mt-1 c360-text-xs c360-text-muted">
                  Skipped because a previous file failed.
                </p>
              )}
              {r.status === "cancelled" && (
                <p className="c360-m-0 c360-mt-1 c360-text-xs c360-text-muted">
                  Upload was cancelled.
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function computeOverallBatchBytes(rows: BatchFileRow[]): {
  value: number;
  max: number;
} {
  const max = rows.reduce((s, r) => s + Math.max(r.sizeBytes, 0), 0);
  let value = 0;
  for (const r of rows) {
    if (r.status === "done") value += r.sizeBytes;
    else if (r.status === "uploading") value += r.uploadedBytes;
  }
  return { value, max: Math.max(max, 1) };
}

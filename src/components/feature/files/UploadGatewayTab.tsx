"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Upload, XCircle, Copy, FolderUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Radio, RadioGroup } from "@/components/ui/Radio";
import { useMultipartUpload } from "@/hooks/useMultipartUpload";
import { toast } from "sonner";
import { cn, formatFileSize } from "@/lib/utils";
import { isAllowedTabularFilename } from "@/lib/tabularUpload";
import type { CompleteUploadResponse } from "@/graphql/generated/types";
import {
  BatchFileUploadStatus,
  computeOverallBatchBytes,
  type BatchFileRow,
} from "./BatchFileUploadStatus";

type PrefixChoice = "default" | "upload" | "exports";

function prefixForChoice(c: PrefixChoice): string | null {
  if (c === "upload") return "upload/";
  if (c === "exports") return "exports/";
  return null;
}

const TABULAR_ACCEPT =
  ".csv,.tsv,.xlsx,.xls,text/csv,text/tab-separated-values,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type GatewayQueueRow = BatchFileRow & { file: File };

function makeQueueRows(files: File[]): GatewayQueueRow[] {
  return files.map((file, i) => ({
    id: `${file.name}-${file.size}-${file.lastModified}-${i}`,
    file,
    name: file.name,
    sizeBytes: file.size,
    status: "pending",
    uploadedBytes: 0,
    totalBytes: file.size,
    partNumber: 0,
    numParts: 0,
  }));
}

function toDisplayRows(rows: GatewayQueueRow[]): BatchFileRow[] {
  return rows.map(({ file: _f, ...r }) => r);
}

export interface UploadGatewayTabProps {
  /** Refresh file list after a successful gateway upload. */
  onSuccess?: () => void;
}

/**
 * Gateway `upload.*` multipart flow — per-file status, overall byte progress,
 * and part N/M from the multipart hook.
 */
export function UploadGatewayTab({ onSuccess }: UploadGatewayTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queueRows, setQueueRows] = useState<GatewayQueueRow[]>([]);
  const [batchResults, setBatchResults] = useState<CompleteUploadResponse[]>(
    [],
  );
  const [pickWarning, setPickWarning] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [prefixChoice, setPrefixChoice] = useState<PrefixChoice>("default");
  const { phase, progress, error, result, upload, cancel, reset, uploading } =
    useMultipartUpload({
      onSuccess: () => {
        onSuccess?.();
      },
    });

  useEffect(() => {
    if (phase === "idle") {
      setQueueRows([]);
      setBatchResults([]);
      setPickWarning(null);
      setBatchError(null);
      setBatchRunning(false);
      setActiveIndex(-1);
    }
  }, [phase]);

  useEffect(() => {
    if (!batchRunning || activeIndex < 0 || !uploading) return;
    setQueueRows((prev) =>
      prev.map((r, j) =>
        j === activeIndex
          ? {
              ...r,
              uploadedBytes: progress.value,
              totalBytes: progress.max,
              partNumber: progress.partNumber,
              numParts: progress.numParts,
              status: "uploading",
            }
          : r,
      ),
    );
  }, [
    batchRunning,
    activeIndex,
    uploading,
    progress.value,
    progress.max,
    progress.partNumber,
    progress.numParts,
  ]);

  const addFilesFromList = useCallback((list: FileList | File[] | null) => {
    setPickWarning(null);
    setBatchError(null);
    setBatchResults([]);
    if (!list || list.length === 0) {
      setQueueRows([]);
      return;
    }
    const arr = Array.from(list);
    const ok = arr.filter((f) => isAllowedTabularFilename(f.name));
    const bad = arr.length - ok.length;
    if (bad > 0 && ok.length === 0) {
      setPickWarning(
        "Only .csv, .tsv, .xlsx, and .xls files are supported for this upload.",
      );
      setQueueRows([]);
      return;
    }
    if (bad > 0) {
      setPickWarning(
        `${bad} file(s) skipped (allowed: .csv, .tsv, .xlsx, .xls).`,
      );
    }
    setQueueRows(makeQueueRows(ok));
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      addFilesFromList(e.dataTransfer.files);
    },
    [addFilesFromList],
  );

  const updateRow = useCallback(
    (index: number, patch: Partial<BatchFileRow>) => {
      setQueueRows((prev) =>
        prev.map((r, j) => (j === index ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  const displayRows = useMemo(() => toDisplayRows(queueRows), [queueRows]);
  const { value: overallValue, max: overallMax } = useMemo(
    () => computeOverallBatchBytes(displayRows),
    [displayRows],
  );

  const activeRow = queueRows[activeIndex];
  const chunkHint =
    batchRunning && uploading && activeRow && progress.numParts > 0
      ? `${activeRow.name} · Part ${progress.partNumber} / ${progress.numParts}`
      : batchRunning && uploading && activeRow
        ? `${activeRow.name} · uploading…`
        : null;

  const busy = batchRunning || uploading;

  const handleStart = async () => {
    if (queueRows.length === 0) return;
    const snapshot = queueRows;
    const prefix = prefixForChoice(prefixChoice);
    setBatchError(null);
    setBatchResults([]);
    setBatchRunning(true);
    setQueueRows((prev) =>
      prev.map((r) => ({
        ...r,
        status: "pending",
        uploadedBytes: 0,
        totalBytes: r.file.size,
        partNumber: 0,
        numParts: 0,
        errorMessage: undefined,
      })),
    );

    const outs: CompleteUploadResponse[] = [];
    let currentIndex = 0;
    try {
      for (let i = 0; i < snapshot.length; i++) {
        currentIndex = i;
        const f = snapshot[i].file;
        setActiveIndex(i);
        updateRow(i, {
          status: "uploading",
          uploadedBytes: 0,
          totalBytes: f.size,
          partNumber: 0,
          numParts: 0,
        });
        const out = await upload(f, { prefix });
        outs.push(out);
        updateRow(i, {
          status: "done",
          uploadedBytes: f.size,
          totalBytes: f.size,
        });
      }
      setActiveIndex(-1);
      if (snapshot.length > 1) {
        setBatchResults(outs);
        toast.success(`Uploaded ${snapshot.length} files.`);
      } else {
        setBatchResults([]);
        toast.success(`Uploaded "${snapshot[0].file.name}".`);
      }
    } catch (e) {
      setActiveIndex(-1);
      const at = currentIndex;
      const aborted = e instanceof DOMException && e.name === "AbortError";
      if (aborted) {
        setQueueRows((prev) =>
          prev.map((r, j) =>
            j >= at && r.status !== "done"
              ? { ...r, status: "cancelled" as const }
              : r,
          ),
        );
        setBatchError(null);
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        setQueueRows((prev) =>
          prev.map((r, j) => {
            if (j === at) return { ...r, status: "error", errorMessage: msg };
            if (j > at && r.status === "pending")
              return { ...r, status: "incomplete" };
            return r;
          }),
        );
        setBatchError(`Stopped at “${snapshot[at]?.name ?? "file"}”: ${msg}`);
        toast.error(msg);
      }
      setBatchResults([]);
    } finally {
      setBatchRunning(false);
    }
  };

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success("File key copied.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  const handleReset = () => {
    reset();
    setQueueRows([]);
    setBatchResults([]);
    setPickWarning(null);
    setBatchError(null);
    setBatchRunning(false);
    setActiveIndex(-1);
  };

  const stepFile = queueRows.length > 0;
  const stepUploading = busy || (phase === "success" && batchRunning);
  const stepDone = phase === "success" && !batchRunning;
  const showMultiSuccess = batchResults.length > 1 && phase === "success";
  const singleResult = result && phase === "success" && !showMultiSuccess;

  return (
    <div className="c360-upload-gateway-tab c360-section-stack">
      <p className="c360-text-sm c360-text-muted c360-m-0">
        Uses the <strong>Upload</strong> GraphQL module (multipart presigned
        parts, <code className="c360-mono">Blob.slice</code> per chunk). Overall
        progress sums all files; each row shows pending, uploading, done, error,
        incomplete, or cancelled.
      </p>

      <div
        className="c360-upload-flow-steps"
        role="status"
        aria-label="Upload progress"
      >
        <div className="c360-upload-flow-steps__nodes">
          <span
            className={cn(
              "c360-upload-flow-steps__node",
              stepFile && "c360-upload-flow-steps__node--done",
            )}
            title="Choose files"
          >
            1
          </span>
          <span className="c360-upload-flow-steps__line" aria-hidden />
          <span
            className={cn(
              "c360-upload-flow-steps__node",
              stepUploading && "c360-upload-flow-steps__node--done",
            )}
            title="Upload"
          >
            2
          </span>
          <span className="c360-upload-flow-steps__line" aria-hidden />
          <span
            className={cn(
              "c360-upload-flow-steps__node",
              stepDone && "c360-upload-flow-steps__node--done",
            )}
            title="Complete"
          >
            3
          </span>
        </div>
        <div className="c360-upload-flow-steps__labels">
          <span>Files</span>
          <span>Upload</span>
          <span>Done</span>
        </div>
      </div>

      <div>
        <div className="c360-section-label c360-mb-2">Key prefix</div>
        <RadioGroup
          name="upload-prefix-modal"
          value={prefixChoice}
          onChange={(v) => setPrefixChoice(v as PrefixChoice)}
          className="c360-section-stack c360-gap-2"
        >
          <Radio
            value="default"
            label="Default (server assigns under upload/)"
          />
          <Radio value="upload" label="upload/" />
          <Radio value="exports" label="exports/" />
        </RadioGroup>
      </div>

      <label htmlFor="upload-gateway-modal-file" className="c360-sr-only">
        Choose data files
      </label>
      <input
        id="upload-gateway-modal-file"
        ref={inputRef}
        type="file"
        accept={TABULAR_ACCEPT}
        multiple
        className="c360-sr-only"
        disabled={busy}
        aria-label="Choose CSV, TSV, or Excel files"
        onChange={(e) => addFilesFromList(e.target.files)}
      />

      <div
        className="c360-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => !busy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!busy && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <FolderUp
          size={36}
          className="c360-text-muted c360-block c360-mx-auto c360-mb-2"
        />
        <p className="c360-page-subtitle c360-m-0">
          Drop files here or click to browse (multiple allowed)
        </p>
        {queueRows.length > 0 && (
          <p className="c360-text-muted c360-mt-2 c360-mb-0 c360-text-sm">
            {queueRows.length} file{queueRows.length !== 1 ? "s" : ""} selected
            · {formatFileSize(queueRows.reduce((s, r) => s + r.sizeBytes, 0))}{" "}
            total
          </p>
        )}
      </div>

      {pickWarning && (
        <Alert variant="warning" className="c360-m-0">
          {pickWarning}
        </Alert>
      )}

      {batchError && (
        <Alert variant="danger" className="c360-m-0">
          {batchError}
        </Alert>
      )}

      {error && phase !== "cancelled" && !batchError && (
        <Alert variant="danger">{error}</Alert>
      )}
      {phase === "cancelled" && error && (
        <Alert variant="warning">{error}</Alert>
      )}

      <BatchFileUploadStatus
        rows={displayRows}
        overallValue={overallValue}
        overallMax={overallMax}
        busy={busy}
        chunkHint={chunkHint}
        overallLabel="Overall progress (all files & chunks)"
      />

      {showMultiSuccess && (
        <Alert variant="success" title="Uploads complete">
          <div className="c360-section-stack c360-gap-2">
            <p className="c360-m-0 c360-text-sm">
              {batchResults.length} file keys (jobs / S3):
            </p>
            <ul className="c360-m-0 c360-pl-4 c360-section-stack c360-gap-2">
              {batchResults.map((r, i) => (
                <li key={`${r.fileKey}-${i}`} className="c360-text-sm">
                  <code className="c360-mono c360-file-detail__key c360-break-all">
                    {r.fileKey}
                  </code>
                  <div className="c360-mt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Copy size={14} />}
                      onClick={() => void copyKey(r.fileKey)}
                    >
                      Copy
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      {singleResult && result?.fileKey && (
        <Alert variant="success" title="Upload complete">
          <div className="c360-section-stack c360-gap-2">
            <p className="c360-m-0 c360-text-sm">
              <strong>fileKey</strong> (use in jobs / S3):
            </p>
            <code className="c360-mono c360-text-sm c360-file-detail__key">
              {result.fileKey}
            </code>
            <div className="c360-flex c360-gap-2 c360-flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Copy size={14} />}
                onClick={() => void copyKey(result.fileKey)}
              >
                Copy key
              </Button>
            </div>
          </div>
        </Alert>
      )}

      <div className="c360-flex c360-gap-2 c360-flex-wrap">
        <Button
          leftIcon={<Upload size={16} />}
          onClick={() => void handleStart()}
          disabled={queueRows.length === 0 || busy}
        >
          {busy
            ? "Uploading…"
            : queueRows.length > 1
              ? `Start upload (${queueRows.length} files)`
              : "Start upload"}
        </Button>
        <Button
          variant="secondary"
          onClick={cancel}
          disabled={!uploading}
          leftIcon={<XCircle size={16} />}
        >
          Cancel
        </Button>
        <Button variant="ghost" onClick={handleReset} disabled={busy}>
          Reset
        </Button>
      </div>
    </div>
  );
}

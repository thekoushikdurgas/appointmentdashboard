"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { FolderOpen, FileSpreadsheet, Database, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Progress } from "@/components/ui/Progress";
import { Radio, RadioGroup } from "@/components/ui/Radio";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { toast } from "sonner";
import type { S3FileInfo } from "@/graphql/generated/types";
import { UploadGatewayTab } from "./UploadGatewayTab";
import { formatFileSize } from "@/lib/utils";
import { isAllowedTabularFilename } from "@/lib/tabularUpload";
import type { TabularMultipartProgressCallback } from "@/lib/multipartUploadTypes";
import {
  BatchFileUploadStatus,
  computeOverallBatchBytes,
  type BatchFileRow,
} from "./BatchFileUploadStatus";

const TABULAR_ACCEPT =
  ".csv,.tsv,.xlsx,.xls,text/csv,text/tab-separated-values,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const DEST_FOLDERS = [
  { value: "upload", label: "upload/", description: "Default upload folder" },
  { value: "exports", label: "exports/", description: "Exports folder" },
] as const;

export interface S3FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploading: boolean;
  uploadCsvFile: (
    file: File,
    onProgress?: TabularMultipartProgressCallback,
    abortSignal?: AbortSignal,
  ) => Promise<S3FileInfo>;
  /** After any successful upload (S3 CSV or gateway), refresh the file list. */
  onUploaded?: (info?: S3FileInfo) => void;
}

type DirectQueueRow = BatchFileRow & {
  file: File;
  abortController?: AbortController;
};

function makeQueueRows(files: File[]): DirectQueueRow[] {
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

function toDisplayRows(rows: DirectQueueRow[]): BatchFileRow[] {
  return rows.map(({ file: _f, abortController: _ac, ...r }) => r);
}

function S3CsvPane({
  isOpen,
  uploading,
  uploadCsvFile,
  onUploaded,
  onClose,
}: Pick<
  S3FileUploadModalProps,
  "uploading" | "uploadCsvFile" | "onUploaded" | "onClose"
> & { isOpen: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queueRows, setQueueRows] = useState<DirectQueueRow[]>([]);
  const [pickWarning, setPickWarning] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [destFolder, setDestFolder] = useState<string>("upload");
  const activeAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQueueRows([]);
    setPickWarning(null);
    setBatchError(null);
    setBatchBusy(false);
    setDestFolder("upload");
  }, [isOpen]);

  const addFilesFromList = useCallback((list: FileList | File[] | null) => {
    setPickWarning(null);
    setBatchError(null);
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

  const busy = uploading || batchBusy;

  const displayRows = useMemo(() => toDisplayRows(queueRows), [queueRows]);
  const { value: overallValue, max: overallMax } = useMemo(
    () => computeOverallBatchBytes(displayRows),
    [displayRows],
  );

  const activeRow = queueRows.find((r) => r.status === "uploading");
  const chunkHint =
    busy && activeRow && activeRow.numParts > 0
      ? `${activeRow.name} · Part ${activeRow.partNumber} / ${activeRow.numParts}`
      : busy && activeRow
        ? `${activeRow.name} · uploading…`
        : null;

  const updateRow = useCallback(
    (index: number, patch: Partial<BatchFileRow>) => {
      setQueueRows((prev) =>
        prev.map((r, j) => (j === index ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  /** Cancel the currently uploading file. */
  const handleCancelRow = useCallback((index: number) => {
    setQueueRows((prev) => {
      const row = prev[index];
      if (row?.abortController) {
        row.abortController.abort();
      }
      return prev.map((r, j) =>
        j === index ? { ...r, status: "error", errorMessage: "Cancelled" } : r,
      );
    });
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
    }
  }, []);

  const handleUpload = async () => {
    if (queueRows.length === 0) return;
    const snapshot = queueRows;
    setBatchError(null);
    setBatchBusy(true);
    setQueueRows((prev) =>
      prev.map((r) => ({
        ...r,
        status: "pending",
        uploadedBytes: 0,
        totalBytes: r.file.size,
        partNumber: 0,
        numParts: 0,
        errorMessage: undefined,
        abortController: undefined,
      })),
    );

    let lastInfo: S3FileInfo | undefined;
    let currentIndex = 0;
    try {
      for (let i = 0; i < snapshot.length; i++) {
        currentIndex = i;
        const file = snapshot[i].file;
        const controller = new AbortController();
        activeAbortRef.current = controller;

        // Store controller on row for per-row cancel button
        setQueueRows((prev) =>
          prev.map((r, j) =>
            j === i ? { ...r, abortController: controller } : r,
          ),
        );

        updateRow(i, {
          status: "uploading",
          uploadedBytes: 0,
          totalBytes: file.size,
          partNumber: 0,
          numParts: 0,
        });

        const onProgress: TabularMultipartProgressCallback = (
          uploaded,
          total,
          part,
        ) => {
          updateRow(i, {
            uploadedBytes: uploaded,
            totalBytes: total > 0 ? total : file.size,
            partNumber: part?.partNumber ?? 0,
            numParts: part?.numParts ?? 0,
          });
        };

        const info = await uploadCsvFile(file, onProgress, controller.signal);
        lastInfo = info;
        updateRow(i, {
          status: "done",
          uploadedBytes: file.size,
          totalBytes: file.size,
        });
      }

      toast.success(
        snapshot.length > 1
          ? `Uploaded ${snapshot.length} files.`
          : `Uploaded "${snapshot[0].file.name}".`,
      );
      onUploaded?.(lastInfo);
      onClose();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message === "signal is aborted without reason" ||
            e.name === "AbortError"
            ? "Upload cancelled"
            : e.message
          : "Upload failed";
      const at = currentIndex;
      setQueueRows((prev) =>
        prev.map((r, j) => {
          if (j === at) return { ...r, status: "error", errorMessage: msg };
          if (j > at && r.status === "pending")
            return { ...r, status: "incomplete" };
          return r;
        }),
      );
      setBatchError(`Stopped at "${snapshot[at]?.name ?? "file"}": ${msg}`);
      if (msg !== "Upload cancelled") toast.error(msg);
    } finally {
      activeAbortRef.current = null;
      setBatchBusy(false);
    }
  };

  return (
    <>
      <p className="c360-text-sm c360-text-muted c360-m-0">
        Multipart upload (chunked for large files). CSV, TSV, and Excel (.xlsx /
        .xls) are supported. Select multiple files; each file shows parts and
        bytes. The list below shows pending, uploading, done, and any errors.
      </p>

      {/* Destination folder radio */}
      <div className="c360-upload-modal__dest-radio">
        <span className="c360-text-sm c360-text-muted c360-mr-2">
          Destination folder:
        </span>
        <RadioGroup
          name="dest-folder"
          value={destFolder}
          onChange={setDestFolder}
          horizontal
        >
          {DEST_FOLDERS.map((f) => (
            <Radio
              key={f.value}
              value={f.value}
              label={f.label}
              description={f.description}
              disabled={busy}
            />
          ))}
        </RadioGroup>
      </div>

      <label htmlFor="s3-csv-upload-input" className="c360-sr-only">
        Choose data files
      </label>
      <input
        id="s3-csv-upload-input"
        ref={inputRef}
        type="file"
        accept={TABULAR_ACCEPT}
        multiple
        className="c360-sr-only"
        aria-label="Choose CSV, TSV, or Excel files"
        onChange={(e) => addFilesFromList(e.target.files)}
      />

      <div
        className="c360-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <FileSpreadsheet
          size={36}
          className="c360-text-success c360-block c360-mx-auto c360-mb-2"
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
        <Alert variant="warning" className="c360-mt-3">
          {pickWarning}
        </Alert>
      )}

      {batchError && (
        <Alert variant="danger" className="c360-mt-3">
          {batchError}
        </Alert>
      )}

      {/* Overall Progress bar using the Progress component */}
      {busy && (
        <div className="c360-mt-3">
          <Progress
            value={overallValue}
            max={overallMax > 0 ? overallMax : 1}
            size="md"
            color="primary"
            label={chunkHint ?? "Uploading…"}
            showValue
          />
        </div>
      )}

      <BatchFileUploadStatus
        rows={displayRows}
        overallValue={overallValue}
        overallMax={overallMax}
        busy={busy}
        chunkHint={chunkHint}
        overallLabel="Overall progress (all files & chunks)"
        renderRowExtra={(row, index) =>
          row.status === "uploading" ? (
            <button
              type="button"
              className="c360-files-dt__action-btn c360-ml-2"
              aria-label={`Cancel upload of ${row.name}`}
              title="Cancel this file"
              onClick={() => handleCancelRow(index)}
            >
              <X size={14} />
            </button>
          ) : null
        }
      />

      <div className="c360-badge-row c360-mt-4 c360-justify-end">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={queueRows.length === 0 || busy}
          leftIcon={<FolderOpen size={16} />}
        >
          {busy
            ? "Uploading…"
            : queueRows.length > 1
              ? `Upload ${queueRows.length} files`
              : "Upload"}
        </Button>
      </div>
    </>
  );
}

export function S3FileUploadModal({
  isOpen,
  onClose,
  uploading,
  uploadCsvFile,
  onUploaded,
}: S3FileUploadModalProps) {
  const [tab, setTab] = useState("s3csv");

  useEffect(() => {
    if (!isOpen) return;
    setTab("s3csv");
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload files"
      size="lg"
      className="c360-upload-file-modal"
    >
      <Tabs value={tab} onValueChange={setTab} variant="underline">
        <TabsList className="c360-upload-file-modal__tabs">
          <TabsTrigger value="s3csv" icon={<Database size={16} />}>
            Direct to storage
          </TabsTrigger>
          <TabsTrigger value="gateway" icon={<FileSpreadsheet size={16} />}>
            Gateway multipart
          </TabsTrigger>
        </TabsList>

        <TabsContent value="s3csv">
          <div className="c360-section-stack">
            <S3CsvPane
              isOpen={isOpen}
              uploading={uploading}
              uploadCsvFile={uploadCsvFile}
              onUploaded={onUploaded}
              onClose={onClose}
            />
          </div>
        </TabsContent>

        <TabsContent value="gateway">
          <UploadGatewayTab
            onSuccess={() => {
              onUploaded?.();
            }}
          />
        </TabsContent>
      </Tabs>
    </Modal>
  );
}

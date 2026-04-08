"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Upload, ChevronRight, ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Input } from "@/components/ui/Input";
import {
  emailService,
  type BulkEmailFinderResponse,
} from "@/services/graphql/emailService";
import {
  parseFinderCsv,
  sniffCsvHeaders,
  guessFinderColumnMap,
  countCsvDataRows,
  type FinderColumnMap,
} from "@/lib/emailCsv";
import { parseEmailServiceError } from "@/lib/emailErrors";
import { toast } from "sonner";
import { emailVerifyBadgeColor } from "@/lib/emailStatus";
import { cn } from "@/lib/utils";
import { useS3Files } from "@/hooks/useS3Files";
import { jobsService } from "@/services/graphql/jobsService";

const SYNC_CAP = 50;
/**
 * Satellite bulk sync can exceed 120s (logs: ~128s for 2 rows). Keep this below the edge
 * `proxy_read_timeout` for the API (e.g. 300s in EC2/nginx) so the browser fails here, not with HTML 504.
 */
const SYNC_REQUEST_TIMEOUT_MS = 290_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`));
      }, ms);
    }),
  ]);
}

/** Clamp chosen batch size to API limit and available parsed rows. */
function clampSyncBatchSize(choice: number, validRowCount: number): number {
  if (validRowCount <= 0) return 1;
  const cap = Math.min(SYNC_CAP, validRowCount);
  return Math.min(cap, Math.max(1, Math.floor(choice)));
}

const STEPS = ["Upload CSV", "Map Columns", "Run sync"];

function StepHeader({ step, total }: { step: number; total: number }) {
  return (
    <div className="c360-wizard-header">
      <div className="c360-wizard-steps">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "c360-wizard-step",
              i + 1 === step && "c360-wizard-step--active",
              i + 1 < step && "c360-wizard-step--done",
              i + 1 > step && "c360-wizard-step--pending",
            )}
          >
            <div className="c360-wizard-step__dot">
              {i + 1 < step ? "✓" : i + 1}
            </div>
            <span className="c360-wizard-step__label">{label}</span>
          </div>
        ))}
      </div>
      <ProgressBar value={((step - 1) / (total - 1)) * 100} tone="primary" size="sm" />
    </div>
  );
}

export function EmailBulkFinderTab() {
  const [step, setStep] = useState(1);
  const [rawCsv, setRawCsv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [columns, setColumns] = useState<FinderColumnMap>({
    firstName: "first_name",
    lastName: "last_name",
    domain: "domain",
  });
  const [syncResult, setSyncResult] = useState<BulkEmailFinderResponse | null>(
    null,
  );
  const [loadingSync, setLoadingSync] = useState(false);
  /** How many parsed rows to send in the next sync request (max API limit and ≤ valid rows). */
  const [syncRowCount, setSyncRowCount] = useState(SYNC_CAP);
  const [startingFinderJob, setStartingFinderJob] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadCsvFile, bucketName, uploading: s3Uploading } =
    useS3Files(undefined);

  const headers = useMemo(
    () => (rawCsv ? sniffCsvHeaders(rawCsv) : []),
    [rawCsv],
  );

  useEffect(() => {
    if (!fileName) {
      setColumns({
        firstName: "first_name",
        lastName: "last_name",
        domain: "domain",
      });
      return;
    }
    if (headers.length === 0) return;
    setColumns(guessFinderColumnMap(headers));
  }, [fileName, headers]);

  const parsedRows = useMemo(() => {
    if (!rawCsv.trim()) return [];
    try {
      return parseFinderCsv(rawCsv, columns);
    } catch {
      return [];
    }
  }, [rawCsv, columns]);

  const maxSyncRowsThisFile =
    parsedRows.length === 0 ? SYNC_CAP : Math.min(SYNC_CAP, parsedRows.length);

  useEffect(() => {
    if (parsedRows.length === 0) return;
    setSyncRowCount((prev) => clampSyncBatchSize(prev, parsedRows.length));
  }, [parsedRows.length]);

  const dataRowCount = useMemo(
    () => (rawCsv.trim() ? countCsvDataRows(rawCsv) : 0),
    [rawCsv],
  );

  const onFile = (f: File | null) => {
    if (!f) {
      setRawCsv("");
      setFileName(null);
      return;
    }
    setFileName(f.name);
    const reader = new FileReader();
    reader.onerror = () => {
      toast.error("Could not read that file.");
      setFileName(null);
      setRawCsv("");
    };
    reader.onload = () => {
      setRawCsv(String(reader.result ?? ""));
      setSyncResult(null);
      setSyncRowCount(SYNC_CAP);
    };
    reader.readAsText(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const ok =
      f.name.toLowerCase().endsWith(".csv") ||
      f.type === "text/csv" ||
      f.type === "application/vnd.ms-excel";
    if (ok) onFile(f);
    else toast.error("Please drop a CSV file.");
  };

  /** Upload current CSV to workspace S3, then enqueue email.server finder job (same payload as Jobs modal). */
  const startFinderJobFromWizard = useCallback(async () => {
    if (!rawCsv.trim()) {
      toast.error("Upload a CSV first.");
      return;
    }
    if (dataRowCount === 0) {
      toast.error("No data rows in this file.");
      return;
    }
    setStartingFinderJob(true);
    try {
      const safeName =
        fileName && /\.(csv|tsv)$/i.test(fileName)
          ? fileName
          : "bulk-finder.csv";
      const file = new File([rawCsv], safeName, {
        type: "text/csv;charset=utf-8",
      });
      const uploaded = await uploadCsvFile(file);
      const res = await jobsService.createEmailFinderExport({
        inputCsvKey: uploaded.key,
        outputPrefix: "exports/",
        ...(bucketName?.trim()
          ? { s3Bucket: bucketName.trim() }
          : {}),
        csvColumns: {
          firstName: columns.firstName.trim() || "first_name",
          lastName: columns.lastName.trim() || "last_name",
          domain: columns.domain.trim() || "domain",
        },
      });
      const job = res.jobs.createEmailFinderExport;
      toast.success(`Email finder job started · ${job.jobId}`);
    } catch (e) {
      toast.error(parseEmailServiceError(e));
    } finally {
      setStartingFinderJob(false);
    }
  }, [
    rawCsv,
    dataRowCount,
    fileName,
    uploadCsvFile,
    bucketName,
    columns.firstName,
    columns.lastName,
    columns.domain,
  ]);

  const runSync = async () => {
    if (parsedRows.length === 0) {
      toast.error("No valid rows — check column names match your CSV header.");
      return;
    }
    const n = clampSyncBatchSize(syncRowCount, parsedRows.length);
    setSyncRowCount(n);
    const items = parsedRows.slice(0, n);
    setLoadingSync(true);
    setSyncResult(null);
    try {
      const data = await withTimeout(
        emailService.findEmailsBulk(items),
        SYNC_REQUEST_TIMEOUT_MS,
        "findEmailsBulk",
      );
      setSyncResult(data.email.findEmailsBulk);
      toast.success(
        parsedRows.length > n
          ? `Processed first ${n} of ${parsedRows.length} rows in this run.`
          : "Bulk find complete.",
      );
    } catch (e) {
      toast.error(parseEmailServiceError(e));
    } finally {
      setLoadingSync(false);
    }
  };

  const jobButtonBusy = startingFinderJob || s3Uploading;

  return (
    <Card
      title="Bulk email finder"
      subtitle={`Sync run via findEmailsBulk — up to ${SYNC_CAP} rows per request. Larger CSVs: use an S3 finder job from Jobs.`}
    >
      <div className="c360-section-stack c360-max-w-720">
        <StepHeader step={step} total={STEPS.length} />

        {/* Step 1 — Upload CSV */}
        {step === 1 && (
          <div className="c360-section-stack">
            <label htmlFor="email-bulk-finder-csv" className="c360-sr-only">
              Upload CSV file for bulk email finder
            </label>
            <input
              ref={fileInputRef}
              id="email-bulk-finder-csv"
              type="file"
              accept=".csv,text/csv"
              className="c360-sr-only"
              aria-label="Upload CSV file for bulk email finder"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            <div
              className="c360-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <Upload size={28} className="c360-dropzone__icon" />
              <p
                className={cn(
                  "c360-dropzone__label",
                  fileName && "c360-dropzone__label--selected",
                )}
              >
                {fileName ?? "Click or drop CSV here"}
              </p>
              <p className="c360-dropzone__hint">
                Header row required. Data rows in file: {dataRowCount}
                {rawCsv.trim()
                  ? ` · Valid finder rows (after column mapping): ${parsedRows.length}`
                  : ""}
              </p>
            </div>
            {headers.length > 0 && (
              <div>
                <p className="c360-text-xs c360-text-muted c360-mb-2">
                  Detected columns ({headers.length})
                </p>
                <div className="c360-flex c360-flex-wrap c360-gap-1">
                  {headers.map((h, i) => (
                    <Badge key={`${i}-${h}`} color="gray" size="sm">
                      {h}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="c360-wizard-nav">
              <Button
                onClick={() => setStep(2)}
                rightIcon={<ChevronRight size={14} />}
                disabled={!rawCsv.trim() || dataRowCount === 0}
              >
                Next: Map Columns
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Map Columns */}
        {step === 2 && (
          <div className="c360-section-stack">
            <p className="c360-text-sm c360-text-muted">
              Map each field to the exact column name from your CSV (we pre-fill
              common names). Finder needs first name, last name, and company
              domain or website per row.
            </p>
            {headers.length > 0 && (
              <div className="c360-flex c360-flex-wrap c360-gap-1 c360-mb-2">
                {headers.map((h, i) => (
                  <Badge key={`${i}-${h}`} color="gray" size="sm">
                    {h}
                  </Badge>
                ))}
              </div>
            )}
            <div className="c360-form-grid">
              {(
                [
                  ["firstName", "First name column"],
                  ["lastName", "Last name column"],
                  ["domain", "Domain or website column"],
                ] as const
              ).map(([key, label]) => (
                <Input
                  key={key}
                  label={label}
                  value={columns[key]}
                  onChange={(e) =>
                    setColumns((c) => ({ ...c, [key]: e.target.value }))
                  }
                  inputSize="sm"
                />
              ))}
            </div>
            <p className="c360-text-xs c360-text-muted">
              Preview: {parsedRows.length} rows parsed with current mapping.
            </p>
            <div className="c360-wizard-nav">
              <Button
                variant="secondary"
                leftIcon={<ChevronLeft size={14} />}
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                rightIcon={<ChevronRight size={14} />}
                disabled={parsedRows.length === 0}
              >
                Next: Run
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Run sync only */}
        {step === 3 && (
          <div className="c360-section-stack">
            <p className="c360-text-sm">
              Ready to process <strong>{parsedRows.length}</strong> valid rows.
              Each sync request can include up to <strong>{SYNC_CAP}</strong>{" "}
              rows (API limit).
            </p>
            <div className="c360-max-w-xs">
              <Input
                id="email-bulk-finder-row-count"
                type="number"
                label="Rows to find this run"
                inputSize="sm"
                min={1}
                max={maxSyncRowsThisFile}
                step={1}
                value={syncRowCount}
                onChange={(e) => {
                  const raw = parseInt(e.target.value, 10);
                  if (!Number.isFinite(raw)) return;
                  setSyncRowCount(clampSyncBatchSize(raw, parsedRows.length));
                }}
                onBlur={() =>
                  setSyncRowCount((prev) =>
                    clampSyncBatchSize(prev, parsedRows.length),
                  )
                }
                helperText={`Use 1–${maxSyncRowsThisFile} for this file (max ${SYNC_CAP} per request).`}
              />
            </div>
            {parsedRows.length > SYNC_CAP && (
              <p className="c360-text-xs c360-text-muted">
                This file has more rows than one sync allows. Choose how many to
                run now, or use Jobs for the full file.
              </p>
            )}
            <div className="c360-flex c360-flex-wrap c360-gap-2">
              <Button
                type="button"
                loading={loadingSync}
                onClick={() => void runSync()}
                disabled={parsedRows.length === 0 || loadingSync}
              >
                Run sync find (
                {clampSyncBatchSize(syncRowCount, parsedRows.length)} rows)
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={jobButtonBusy}
                disabled={
                  !rawCsv.trim() ||
                  dataRowCount === 0 ||
                  jobButtonBusy ||
                  loadingSync
                }
                onClick={() => void startFinderJobFromWizard()}
              >
                Start Jobs
              </Button>
            </div>
            <p className="c360-text-xs c360-text-muted">
              Start Jobs uploads this CSV to your workspace S3 and enqueues{" "}
              <strong>Email finder (bulk)</strong> using your column mapping
              above. For more than {SYNC_CAP} rows in sync, use Start Jobs or{" "}
              <Link href="/jobs" className="c360-text-primary">
                Jobs
              </Link>
              .
            </p>

            {syncResult && (
              <div>
                <p className="c360-text-sm c360-mb-2">
                  Processed {syncResult.processedCount} / requested{" "}
                  {syncResult.totalRequested} · successful{" "}
                  {syncResult.totalSuccessful}
                </p>
                <div className="c360-table-wrapper">
                  <table className="c360-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Domain</th>
                        <th>Emails</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncResult.results.map((row) => (
                        <tr
                          key={`${row.firstName}-${row.lastName}-${row.domain}`}
                        >
                          <td>
                            {row.firstName} {row.lastName}
                          </td>
                          <td>{row.domain}</td>
                          <td>
                            {row.error ? (
                              <span className="c360-text-danger">
                                {row.error}
                              </span>
                            ) : (
                              <div className="c360-section-stack c360-section-stack--sm">
                                {row.emails.map((em) => (
                                  <div
                                    key={em.uuid + em.email}
                                    className="c360-flex c360-gap-2 c360-items-center"
                                  >
                                    <code className="c360-text-xs">
                                      {em.email}
                                    </code>
                                    {em.status ? (
                                      <Badge
                                        color={emailVerifyBadgeColor(em.status)}
                                      >
                                        {em.status}
                                      </Badge>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="c360-wizard-nav">
              <Button
                variant="secondary"
                leftIcon={<ChevronLeft size={14} />}
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep(1);
                  setRawCsv("");
                  setFileName(null);
                  setSyncResult(null);
                  setSyncRowCount(SYNC_CAP);
                }}
              >
                Start over
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

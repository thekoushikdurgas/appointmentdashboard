"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import {
  emailService,
  type BulkEmailVerifierResponse,
} from "@/services/graphql/emailService";
import {
  sniffCsvHeaders,
  guessVerifierEmailColumn,
  parseVerifierEmailsFromCsv,
  countCsvDataRows,
} from "@/lib/emailCsv";
import { parseEmailServiceError } from "@/lib/emailErrors";
import { toast } from "sonner";
import { emailVerifyBadgeColor } from "@/lib/emailStatus";
import { cn } from "@/lib/utils";
import { useS3Files } from "@/hooks/useS3Files";
import { jobsService } from "@/services/graphql/jobsService";

const PROVIDERS = [
  { value: "mailtester", label: "Mailtester" },
  { value: "truelist", label: "Truelist" },
  { value: "icypeas", label: "Icypeas" },
  { value: "mailvetter", label: "Mailvetter" },
];

const MAX_SYNC = 2000;

const STEPS = ["Add emails", "Configure", "Run sync"];

/** Per-request cap for verifyEmailsBulk in the app (API allows more; see email_constants). */
function clampVerifyBatchSize(choice: number, validEmailCount: number): number {
  if (validEmailCount <= 0) return 1;
  const cap = Math.min(MAX_SYNC, validEmailCount);
  return Math.min(cap, Math.max(1, Math.floor(choice)));
}

function parseEmails(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const e = line.trim();
    if (!e || !e.includes("@")) continue;
    if (seen.has(e.toLowerCase())) continue;
    seen.add(e.toLowerCase());
    out.push(e);
  }
  return out;
}

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

export function EmailBulkVerifierTab() {
  const [step, setStep] = useState(1);
  const [text, setText] = useState("");
  const [rawCsv, setRawCsv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [emailColumn, setEmailColumn] = useState("email");
  const [provider, setProvider] = useState("mailtester");
  const [syncRes, setSyncRes] = useState<BulkEmailVerifierResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  /** How many emails to send in the next verify request (≤ API cap and ≤ list size). */
  const [syncVerifyCount, setSyncVerifyCount] = useState(MAX_SYNC);
  const [startingVerifyJob, setStartingVerifyJob] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadCsvFile, bucketName, uploading: s3Uploading } =
    useS3Files(undefined);

  const headers = useMemo(
    () => (rawCsv ? sniffCsvHeaders(rawCsv) : []),
    [rawCsv],
  );

  const dataRowCount = useMemo(
    () => (rawCsv.trim() ? countCsvDataRows(rawCsv) : 0),
    [rawCsv],
  );

  const applyEmailColumn = (csv: string, column: string) => {
    try {
      const list = parseVerifierEmailsFromCsv(csv, column);
      setText(list.join("\n"));
    } catch {
      toast.error("Could not parse CSV — check the email column name.");
    }
  };

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
      const csv = String(reader.result ?? "");
      setRawCsv(csv);
      setSyncRes(null);
      const h = sniffCsvHeaders(csv);
      const col = guessVerifierEmailColumn(h);
      setEmailColumn(col);
      applyEmailColumn(csv, col);
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

  const emails = parseEmails(text);

  const maxVerifyThisList =
    emails.length === 0 ? MAX_SYNC : Math.min(MAX_SYNC, emails.length);

  useEffect(() => {
    if (emails.length === 0) return;
    setSyncVerifyCount((prev) => clampVerifyBatchSize(prev, emails.length));
  }, [emails.length]);

  const verifyBatch = useMemo(() => {
    const n = clampVerifyBatchSize(syncVerifyCount, emails.length);
    return emails.slice(0, n);
  }, [emails, syncVerifyCount]);

  const providerLabel =
    PROVIDERS.find((p) => p.value === provider)?.label ?? provider;

  /** Upload CSV (wizard file or synthesized from pasted emails), then enqueue Email verify (bulk). */
  const startVerifyJobFromWizard = useCallback(async () => {
    const col = emailColumn.trim() || "email";
    let file: File;
    if (rawCsv.trim() && dataRowCount > 0) {
      const safeName =
        fileName && /\.(csv|tsv)$/i.test(fileName)
          ? fileName
          : "bulk-verify.csv";
      file = new File([rawCsv], safeName, {
        type: "text/csv;charset=utf-8",
      });
    } else if (emails.length > 0) {
      const csvBody = `${col}\n${emails.join("\n")}`;
      file = new File([csvBody], "bulk-verify-paste.csv", {
        type: "text/csv;charset=utf-8",
      });
    } else {
      toast.error("Add emails (paste or CSV) before starting a job.");
      return;
    }

    setStartingVerifyJob(true);
    try {
      const uploaded = await uploadCsvFile(file);
      const res = await jobsService.createEmailVerifyExport({
        inputCsvKey: uploaded.key,
        outputPrefix: "exports/",
        ...(bucketName?.trim()
          ? { s3Bucket: bucketName.trim() }
          : {}),
        provider,
        csvColumns: {
          email: col,
        },
      });
      const job = res.jobs.createEmailVerifyExport;
      toast.success(`Email verify job started · ${job.jobId}`);
    } catch (e) {
      toast.error(parseEmailServiceError(e));
    } finally {
      setStartingVerifyJob(false);
    }
  }, [
    rawCsv,
    dataRowCount,
    fileName,
    emails,
    emailColumn,
    provider,
    uploadCsvFile,
    bucketName,
  ]);

  const canStartVerifyJob =
    (rawCsv.trim() && dataRowCount > 0) || emails.length > 0;

  const jobButtonBusy = startingVerifyJob || s3Uploading;

  const runSync = async () => {
    if (verifyBatch.length === 0) {
      toast.error("Add at least one email address (one per line).");
      return;
    }
    setLoading(true);
    setSyncRes(null);
    try {
      const data = await emailService.verifyEmailsBulk(verifyBatch, provider);
      const bulk = data.email.verifyEmailsBulk;
      setSyncRes(bulk);
      toast.success("Bulk verification complete.");
    } catch (e) {
      toast.error(parseEmailServiceError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Bulk email verifier"
      subtitle={`Sync: verifyEmailsBulk (first ${MAX_SYNC} unique addresses). More than ${MAX_SYNC}: use an S3 verify job from Jobs.`}
    >
      <div className="c360-section-stack c360-max-w-720">
        <StepHeader step={step} total={STEPS.length} />

        {/* Step 1 — Paste or upload CSV */}
        {step === 1 && (
          <div className="c360-section-stack">
            <label htmlFor="email-bulk-verifier-csv" className="c360-sr-only">
              Upload CSV file for bulk email verifier
            </label>
            <input
              ref={fileInputRef}
              id="email-bulk-verifier-csv"
              type="file"
              accept=".csv,text/csv"
              className="c360-sr-only"
              aria-label="Upload CSV file for bulk email verifier"
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
                One column should list emails (header row required). Data rows:{" "}
                {dataRowCount}
                {rawCsv.trim()
                  ? ` · Parsed unique addresses: ${emails.length}`
                  : ""}
              </p>
            </div>
            {headers.length > 0 && (
              <div className="c360-section-stack">
                <Input
                  label="Email column (header name from your CSV)"
                  value={emailColumn}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEmailColumn(v);
                    if (rawCsv.trim()) applyEmailColumn(rawCsv, v);
                  }}
                  inputSize="sm"
                />
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
              </div>
            )}
            <div>
              <label className="c360-form-label" htmlFor="bulk-verify-emails">
                Email addresses (one per line)
              </label>
              <textarea
                id="bulk-verify-emails"
                className="c360-input c360-w-full c360-font-mono"
                rows={10}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setSyncRes(null);
                }}
                placeholder={"john@acme.com\njane@acme.com"}
              />
              <p className="c360-text-xs c360-text-muted c360-mt-1">
                Unique addresses detected: {emails.length}
              </p>
            </div>
            {emails.length > MAX_SYNC && (
              <p className="c360-text-xs c360-text-muted">
                This list has more addresses than one sync allows ({MAX_SYNC}).
                On the last step, choose how many to verify per run, or use{" "}
                <Link href="/jobs" className="c360-text-primary">
                  Jobs → Email verify (bulk) from S3
                </Link>{" "}
                for the full file.
              </p>
            )}
            <div className="c360-wizard-nav">
              <Button
                onClick={() => setStep(2)}
                rightIcon={<ChevronRight size={14} />}
                disabled={emails.length === 0}
              >
                Next: Configure
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Configure */}
        {step === 2 && (
          <div className="c360-section-stack">
            <Select
              label="Provider"
              options={PROVIDERS}
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              inputSize="sm"
            />
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
              >
                Next: Run sync
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Run sync (batch size + verify) */}
        {step === 3 && (
          <div className="c360-section-stack">
            <p className="c360-text-sm">
              Ready to process <strong>{emails.length}</strong> unique addresses.
              Each sync request can include up to <strong>{MAX_SYNC}</strong>{" "}
              addresses (app limit). Using <strong>{providerLabel}</strong>.
            </p>
            <div className="c360-max-w-xs">
              <Input
                id="email-bulk-verifier-row-count"
                type="number"
                label="Emails to verify this run"
                inputSize="sm"
                min={1}
                max={maxVerifyThisList}
                step={1}
                value={syncVerifyCount}
                onChange={(e) => {
                  const raw = parseInt(e.target.value, 10);
                  if (!Number.isFinite(raw)) return;
                  setSyncVerifyCount(
                    clampVerifyBatchSize(raw, emails.length),
                  );
                }}
                onBlur={() =>
                  setSyncVerifyCount((prev) =>
                    clampVerifyBatchSize(prev, emails.length),
                  )
                }
                helperText={`Use 1–${maxVerifyThisList} for this list (max ${MAX_SYNC} per request).`}
              />
            </div>
            {emails.length > MAX_SYNC && (
              <p className="c360-text-xs c360-text-muted">
                This list has more addresses than one sync allows. Choose how
                many to run now, or use Jobs for the full file.
              </p>
            )}
            <div className="c360-flex c360-flex-wrap c360-gap-2">
              <Button
                type="button"
                loading={loading}
                onClick={() => void runSync()}
                disabled={emails.length === 0 || loading}
              >
                Run sync verify (
                {clampVerifyBatchSize(syncVerifyCount, emails.length)}{" "}
                addresses)
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={jobButtonBusy}
                disabled={!canStartVerifyJob || jobButtonBusy || loading}
                onClick={() => void startVerifyJobFromWizard()}
              >
                Start Jobs
              </Button>
            </div>
            <p className="c360-text-xs c360-text-muted">
              Start Jobs uploads your CSV (or a file built from pasted emails) to
              workspace S3 and enqueues <strong>Email verify (bulk)</strong> with
              provider <strong>{providerLabel}</strong> and email column{" "}
              <strong>{emailColumn.trim() || "email"}</strong>. For more than{" "}
              {MAX_SYNC} addresses per sync, use Start Jobs or{" "}
              <Link href="/jobs" className="c360-text-primary">
                Jobs
              </Link>
              .
            </p>

            {syncRes && (
              <div>
                <div className="c360-flex c360-flex-wrap c360-gap-3 c360-mb-3">
                  <Badge color="green">valid {syncRes.validCount}</Badge>
                  <Badge color="red">invalid {syncRes.invalidCount}</Badge>
                  <Badge color="orange">catchall {syncRes.catchallCount}</Badge>
                  <Badge color="gray">unknown {syncRes.unknownCount}</Badge>
                  <Badge color="orange">risky {syncRes.riskyCount}</Badge>
                </div>
                <div className="c360-table-wrapper">
                  <table className="c360-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncRes.results.map((r) => (
                        <tr key={r.email}>
                          <td className="c360-text-sm">{r.email}</td>
                          <td>
                            <Badge color={emailVerifyBadgeColor(r.status)}>
                              {r.status}
                            </Badge>
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
                  setText("");
                  setRawCsv("");
                  setFileName(null);
                  setEmailColumn("email");
                  setSyncRes(null);
                  setSyncVerifyCount(MAX_SYNC);
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

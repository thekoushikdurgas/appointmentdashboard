"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Upload,
  CheckCircle,
  FileText,
  Settings,
  Table2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Select } from "@/components/ui/Select";
import { contactsService } from "@/services/graphql/contactsService";
import { useJobPoller } from "@/hooks/useJobPoller";
import { useS3Files } from "@/hooks/useS3Files";
import { parseOperationError } from "@/lib/errorParser";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CONTACT_IMPORT_RECOGNIZABLE_FIELDS,
  CONTACT_IMPORT_FIELD_LABELS,
  applyContactImportColumnMapping,
  buildContactImportUploadFile,
  contactImportHasRecognizableColumn,
  findDuplicateContactImportSources,
  normalizeContactImportHeader,
  parseContactImportCsvHeaders,
  type ContactImportCanonicalField,
} from "@/lib/contactImportCsv";

export interface ContactImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<WizardStep, string> = {
  1: "File",
  2: "Map columns",
  3: "Options",
  4: "Confirm",
};

const STEP_ICONS: Record<WizardStep, React.ReactNode> = {
  1: <FileText size={16} />,
  2: <Table2 size={16} />,
  3: <Settings size={16} />,
  4: <CheckCircle size={16} />,
};

function emptyMapping(): Partial<
  Record<ContactImportCanonicalField, string>
> {
  return {};
}

export function ContactImportModal({
  isOpen,
  onClose,
  onImported,
}: ContactImportModalProps) {
  const { bucketName, uploadCsvFile, uploading } = useS3Files();
  const [step, setStep] = useState<WizardStep>(1);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<
    Partial<Record<ContactImportCanonicalField, string>>
  >(emptyMapping);
  const [outputPrefix, setOutputPrefix] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadBytes, setUploadBytes] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [opError, setOpError] = useState<ReturnType<
    typeof parseOperationError
  > | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [lastUploadedKey, setLastUploadedKey] = useState<string | null>(null);

  const { jobStatus, jobProgress, polling, isTerminal, startPolling, reset } =
    useJobPoller({
      onCompleted: onImported,
    });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPendingFile(null);
      setRawHeaders([]);
      setMapping(emptyMapping());
      setOutputPrefix("");
      setSubmitting(false);
      setUploadBytes(null);
      setOpError(null);
      setActiveJobId(null);
      setLastUploadedKey(null);
      reset();
    }
  }, [isOpen, reset]);

  const headerOptions = useMemo(
    () => [
      { value: "", label: "— Not mapped —" },
      ...rawHeaders.map((h) => ({ value: h, label: h || "(empty)" })),
    ],
    [rawHeaders],
  );

  const normalizedPreview = useMemo(
    () => rawHeaders.map((h) => normalizeContactImportHeader(h)),
    [rawHeaders],
  );

  const autoRecognizable = useMemo(
    () => contactImportHasRecognizableColumn(rawHeaders),
    [rawHeaders],
  );

  const mappedHeaderPreview = useMemo(
    () => applyContactImportColumnMapping(rawHeaders, mapping),
    [rawHeaders, mapping],
  );

  const mappedRecognizable = useMemo(
    () => contactImportHasRecognizableColumn(mappedHeaderPreview),
    [mappedHeaderPreview],
  );

  const ingestFile = useCallback(async (file: File) => {
    setOpError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setOpError({
        userMessage: "Please choose a .csv file.",
        retryable: false,
        isNotFound: false,
        isValidation: true,
        isPermission: false,
        isServiceDown: false,
      });
      return;
    }
    try {
      const headers = await parseContactImportCsvHeaders(file);
      setPendingFile(file);
      setRawHeaders(headers);
      setMapping(emptyMapping());
      setLastUploadedKey(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not read CSV.";
      setOpError({
        userMessage: msg,
        retryable: false,
        isNotFound: false,
        isValidation: true,
        isPermission: false,
        isServiceDown: false,
      });
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) void ingestFile(f);
    },
    [ingestFile],
  );

  const validateStep2 = (): string | null => {
    const dupes = findDuplicateContactImportSources(mapping);
    if (dupes.length) {
      return `Each CSV column can map to at most one field. Duplicates: ${dupes.join(", ")}`;
    }
    if (!mappedRecognizable) {
      return "Map at least one column to a recognizable field (e.g. email, first name, company, or LinkedIn URL).";
    }
    return null;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!pendingFile || rawHeaders.length === 0) {
        setOpError({
          userMessage: "Drop or choose a CSV file first.",
          retryable: false,
          isNotFound: false,
          isValidation: true,
          isPermission: false,
          isServiceDown: false,
        });
        return;
      }
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) {
        setOpError({
          userMessage: err,
          retryable: false,
          isNotFound: false,
          isValidation: true,
          isPermission: false,
          isServiceDown: false,
        });
        return;
      }
    }
    setOpError(null);
    setStep((s) => (s < 4 ? ((s + 1) as WizardStep) : s));
  };

  const handleBack = () => {
    setOpError(null);
    setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s));
  };

  const handleSubmit = async () => {
    if (!pendingFile) return;
    setOpError(null);
    setSubmitting(true);
    setUploadBytes(null);
    try {
      const uploadFile = await buildContactImportUploadFile(
        pendingFile,
        mapping,
      );
      const info = await uploadCsvFile(uploadFile, (done, total) => {
        setUploadBytes({ done, total });
      });
      setLastUploadedKey(info.key);
      const bucket = bucketName?.trim() || "appointment360uploads";
      const job = await contactsService.importContacts({
        s3Bucket: bucket,
        s3Key: info.key.trim(),
        outputPrefix: outputPrefix.trim() || undefined,
        importTarget: "contact",
      });
      setActiveJobId(job.jobId);
      startPolling(job.jobId, job.status);
      toast.success("Import job started", {
        description: `Job ${job.jobId} — ${job.status}`,
      });
    } catch (e) {
      const parsed = parseOperationError(e, "contacts");
      setOpError(parsed);
      toast.error(parsed.userMessage);
    } finally {
      setSubmitting(false);
      setUploadBytes(null);
    }
  };

  const progressValue = isTerminal
    ? 100
    : jobProgress != null && jobProgress > 0
      ? jobProgress
      : 0;

  const busy = submitting || uploading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import contacts from CSV"
      size="lg"
    >
      <div className="c360-section-stack">
        <Alert variant="info" title="SuperAdmin import">
          Uploads go to your Contact360 storage bucket, then Connectra runs the
          CSV import job. Column mapping renames headers so they match what the
          importer expects.
        </Alert>

        <div className="c360-campaign-wizard c360-campaign-wizard--import">
          {([1, 2, 3, 4] as WizardStep[]).map((s) => (
            <div
              key={s}
              className={`c360-campaign-wizard-step${step === s ? " c360-campaign-wizard-step--active" : ""}${step > s ? " c360-campaign-wizard-step--done" : ""}`}
            >
              <div className="c360-campaign-wizard-step-circle">
                {step > s ? <CheckCircle size={14} /> : STEP_ICONS[s]}
              </div>
              <span className="c360-campaign-wizard-step-label">
                {STEP_LABELS[s]}
              </span>
            </div>
          ))}
        </div>

        {opError && (
          <Alert
            variant={opError.isValidation ? "warning" : "danger"}
            title={
              opError.isServiceDown
                ? "Service unavailable"
                : opError.isValidation
                  ? "Validation error"
                  : "Import failed"
            }
            onClose={() => setOpError(null)}
          >
            {opError.userMessage}
          </Alert>
        )}

        {step === 1 && (
          <div className="c360-section-stack">
            <p className="c360-text-sm c360-text-muted">
              Drag and drop a <strong>.csv</strong> file, or choose one from
              your computer. The first row must be column headers.
            </p>
            <div
              className={cn(
                "c360-dropzone",
                "c360-flex c360-min-h-36 c360-cursor-pointer c360-flex-col c360-items-center c360-justify-center c360-gap-2 c360-rounded-md c360-border-2 c360-border-dashed c360-border-ink-12 c360-p-4 c360-text-center",
                "hover:c360-border-primary",
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".csv,text/csv";
                input.onchange = () => {
                  const f = input.files?.[0];
                  if (f) void ingestFile(f);
                };
                input.click();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (e.currentTarget as HTMLDivElement).click();
                }
              }}
            >
              <Upload size={24} className="c360-text-muted" aria-hidden />
              <span className="c360-text-sm c360-font-medium">
                Drop CSV here or click to browse
              </span>
            </div>
            {pendingFile ? (
              <div className="c360-rounded-md c360-border c360-border-ink-8 c360-p-3 c360-text-sm">
                <p className="c360-m-0 c360-font-medium">{pendingFile.name}</p>
                <p className="c360-mt-1 c360-mb-0 c360-text-2xs c360-text-muted">
                  {(pendingFile.size / 1024).toFixed(1)} KB ·{" "}
                  {rawHeaders.length} column
                  {rawHeaders.length === 1 ? "" : "s"}
                  {autoRecognizable ? (
                    <span className="c360-text-success"> · headers OK</span>
                  ) : (
                    <span> · map columns in the next step</span>
                  )}
                </p>
              </div>
            ) : null}
          </div>
        )}

        {step === 2 && (
          <div className="c360-section-stack">
            <p className="c360-text-sm c360-text-muted">
              Map your CSV columns to the fields the importer understands. You
              need at least one of: email, name, company, phone, website, or
              LinkedIn URLs.
            </p>
            {autoRecognizable ? (
              <Alert variant="info" title="Headers look compatible">
                No mapping is required if your columns already match. Adjust only
                when your file uses different header names.
              </Alert>
            ) : null}
            <div className="c360-max-h-64 c360-space-y-3 c360-overflow-y-auto c360-pr-1">
              {CONTACT_IMPORT_RECOGNIZABLE_FIELDS.map((field) => (
                <Select
                  key={field}
                  label={CONTACT_IMPORT_FIELD_LABELS[field]}
                  value={mapping[field] ?? ""}
                  onChange={(e) =>
                    setMapping((m) => ({
                      ...m,
                      [field]: e.target.value || undefined,
                    }))
                  }
                  options={headerOptions}
                  fullWidth
                  inputSize="md"
                />
              ))}
            </div>
            {rawHeaders.length > 0 ? (
              <details className="c360-text-2xs c360-text-muted">
                <summary className="c360-cursor-pointer">
                  Raw columns ({rawHeaders.length})
                </summary>
                <ul className="c360-mt-2 c360-mb-0 c360-list-inside c360-list-disc">
                  {rawHeaders.map((h, i) => (
                    <li key={`${i}-${h}`}>
                      <code>{h || "(empty)"}</code> →{" "}
                      <code>{normalizedPreview[i]}</code>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            {!mappedRecognizable ? (
              <p className="c360-m-0 c360-text-2xs c360-text-warning">
                After mapping, the file must still expose at least one
                recognizable column.
              </p>
            ) : null}
          </div>
        )}

        {step === 3 && (
          <div className="c360-section-stack">
            <p className="c360-text-sm c360-text-muted">
              Optional output prefix for processed files on storage (same as the
              previous S3 flow).
            </p>
            <Input
              label="Output prefix (optional)"
              value={outputPrefix}
              onChange={(e) => setOutputPrefix(e.target.value)}
              placeholder="imports/output/"
              helperText="S3 prefix for processed output files."
            />
            {bucketName ? (
              <p className="c360-m-0 c360-text-2xs c360-text-muted">
                Upload bucket (display): <code>{bucketName}</code>
              </p>
            ) : null}
          </div>
        )}

        {step === 4 && (
          <div className="c360-section-stack">
            <Alert variant="info" title="Review before importing">
              The CSV will be uploaded to your bucket, then the import job will
              start.
            </Alert>
            <dl className="c360-dl-grid">
              <dt>File</dt>
              <dd>{pendingFile?.name ?? "—"}</dd>
              <dt>Columns</dt>
              <dd>{rawHeaders.length}</dd>
              <dt>Mapping</dt>
              <dd>
                {Object.entries(mapping).some(([, v]) => v?.trim())
                  ? "Custom column mapping"
                  : autoRecognizable
                    ? "None (headers already compatible)"
                    : "—"}
              </dd>
              <dt>Upload key</dt>
              <dd>
                {lastUploadedKey ? (
                  <code>{lastUploadedKey}</code>
                ) : (
                  <span className="c360-text-muted">
                    Assigned after upload starts
                  </span>
                )}
              </dd>
              {outputPrefix ? (
                <>
                  <dt>Output prefix</dt>
                  <dd>
                    <code>{outputPrefix}</code>
                  </dd>
                </>
              ) : null}
            </dl>

            {uploadBytes && uploadBytes.total > 0 ? (
              <ProgressBar
                value={Math.round(
                  (100 * uploadBytes.done) / uploadBytes.total,
                )}
                tone="primary"
                animated
                label="Uploading CSV"
                showValue
              />
            ) : null}

            {activeJobId ? (
              <div>
                <p className="c360-text-sm c360-mb-2">
                  Job <code>{activeJobId}</code>
                  {jobStatus ? ` — ${jobStatus}` : ""}
                </p>
                <ProgressBar
                  value={progressValue}
                  tone={isTerminal ? "success" : "primary"}
                  animated={polling && !isTerminal && progressValue === 0}
                  label="Import progress"
                  showValue={progressValue > 0}
                />
              </div>
            ) : null}
          </div>
        )}

        <div className="c360-modal-actions">
          {step > 1 && !activeJobId && (
            <Button variant="ghost" onClick={handleBack} disabled={busy}>
              Back
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          {step < 4 && !activeJobId && (
            <Button onClick={handleNext} disabled={busy}>
              Next
            </Button>
          )}
          {step === 4 && !activeJobId && (
            <Button
              loading={busy}
              leftIcon={<Upload size={14} />}
              onClick={() => void handleSubmit()}
            >
              Upload &amp; start import
            </Button>
          )}
          {step === 4 && activeJobId && isTerminal && (
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

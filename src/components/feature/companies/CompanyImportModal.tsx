"use client";

import { useState, useEffect } from "react";
import { Upload, CheckCircle, FileText, Settings } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { companiesService } from "@/services/graphql/companiesService";
import { useJobPoller } from "@/hooks/useJobPoller";
import { parseOperationError } from "@/lib/errorParser";
import { toast } from "sonner";

export interface CompanyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
}

type WizardStep = 1 | 2 | 3;

const STEP_LABELS: Record<WizardStep, string> = {
  1: "S3 File",
  2: "Options",
  3: "Confirm",
};

const STEP_ICONS: Record<WizardStep, React.ReactNode> = {
  1: <FileText size={16} />,
  2: <Settings size={16} />,
  3: <CheckCircle size={16} />,
};

export function CompanyImportModal({
  isOpen,
  onClose,
  onImported,
}: CompanyImportModalProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [s3Bucket, setS3Bucket] = useState("");
  const [s3Key, setS3Key] = useState("");
  const [outputPrefix, setOutputPrefix] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [opError, setOpError] = useState<ReturnType<
    typeof parseOperationError
  > | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { jobStatus, polling, isTerminal, startPolling, reset } = useJobPoller({
    onCompleted: onImported,
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setS3Bucket("");
      setS3Key("");
      setOutputPrefix("");
      setOpError(null);
      setActiveJobId(null);
      reset();
    }
  }, [isOpen, reset]);

  const validateStep1 = (): string | null => {
    if (!s3Bucket.trim()) return "S3 bucket is required.";
    if (!s3Key.trim()) return "S3 key is required.";
    if (!s3Key.trim().endsWith(".csv"))
      return "S3 key must point to a .csv file.";
    return null;
  };

  const handleNext = () => {
    if (step === 1) {
      const err = validateStep1();
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
    setStep((s) => (s < 3 ? ((s + 1) as WizardStep) : s));
  };

  const handleBack = () => {
    setOpError(null);
    setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s));
  };

  const handleSubmit = async () => {
    setOpError(null);
    setSubmitting(true);
    try {
      const job = await companiesService.importCompanies({
        s3Bucket: s3Bucket.trim(),
        s3Key: s3Key.trim(),
        outputPrefix: outputPrefix.trim() || undefined,
        importTarget: "company",
      });
      setActiveJobId(job.jobId);
      startPolling(job.jobId, job.status);
      toast.success("Import job started", {
        description: `Job ${job.jobId} — ${job.status}`,
      });
    } catch (e) {
      const parsed = parseOperationError(e, "companies");
      setOpError(parsed);
      toast.error(parsed.userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const progressValue = isTerminal ? 100 : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import companies from S3"
      size="md"
    >
      <div className="c360-section-stack">
        {/* Wizard step circles */}
        <div className="c360-campaign-wizard c360-campaign-wizard--import">
          {([1, 2, 3] as WizardStep[]).map((s) => (
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
              Provide the S3 location of the companies CSV to import.
            </p>
            <Input
              label="S3 Bucket *"
              value={s3Bucket}
              onChange={(e) => setS3Bucket(e.target.value)}
              placeholder="my-bucket"
            />
            <Input
              label="S3 Key *"
              value={s3Key}
              onChange={(e) => setS3Key(e.target.value)}
              placeholder="imports/companies.csv"
              helperText="Must be a .csv file accessible to the API."
            />
          </div>
        )}

        {step === 2 && (
          <div className="c360-section-stack">
            <p className="c360-text-sm c360-text-muted">
              Configure optional import settings.
            </p>
            <Input
              label="Output prefix (optional)"
              value={outputPrefix}
              onChange={(e) => setOutputPrefix(e.target.value)}
              placeholder="imports/output/"
              helperText="S3 prefix for processed output files."
            />
          </div>
        )}

        {step === 3 && (
          <div className="c360-section-stack">
            <Alert variant="info" title="Review before importing">
              The following company import will be started:
            </Alert>
            <dl className="c360-dl-grid">
              <dt>Bucket</dt>
              <dd>
                <code>{s3Bucket}</code>
              </dd>
              <dt>Key</dt>
              <dd>
                <code>{s3Key}</code>
              </dd>
              {outputPrefix && (
                <>
                  <dt>Output prefix</dt>
                  <dd>
                    <code>{outputPrefix}</code>
                  </dd>
                </>
              )}
            </dl>

            {activeJobId && (
              <div>
                <p className="c360-text-sm c360-mb-2">
                  Job <code>{activeJobId}</code>
                  {jobStatus ? ` — ${jobStatus}` : ""}
                </p>
                <ProgressBar
                  value={progressValue}
                  tone={isTerminal ? "success" : "primary"}
                  animated={polling && progressValue === 0}
                  label="Import progress"
                  showValue={progressValue > 0}
                />
              </div>
            )}
          </div>
        )}

        <div className="c360-modal-actions">
          {step > 1 && !activeJobId && (
            <Button variant="ghost" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {step < 3 && <Button onClick={handleNext}>Next</Button>}
          {step === 3 && !activeJobId && (
            <Button
              loading={submitting}
              leftIcon={<Upload size={14} />}
              onClick={() => void handleSubmit()}
            >
              Start import
            </Button>
          )}
          {step === 3 && activeJobId && isTerminal && (
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

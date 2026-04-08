"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { companiesService } from "@/services/graphql/companiesService";
import { useJobPoller } from "@/hooks/useJobPoller";
import { parseOperationError } from "@/lib/errorParser";
import { toast } from "sonner";
import type { VqlQueryInput } from "@/graphql/generated/types";

const COMPANY_EXPORT_SERVICE = "company";

export interface CompanyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vqlForExport: VqlQueryInput;
}

export function CompanyExportModal({
  isOpen,
  onClose,
  vqlForExport,
}: CompanyExportModalProps) {
  const [outputPrefix, setOutputPrefix] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [opError, setOpError] = useState<ReturnType<
    typeof parseOperationError
  > | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { jobStatus, polling, isTerminal, startPolling, reset } =
    useJobPoller();

  useEffect(() => {
    if (isOpen) {
      setOutputPrefix(
        `companies-export-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}`,
      );
      setOpError(null);
      setActiveJobId(null);
      reset();
    }
  }, [isOpen, reset]);

  const handleSubmit = async () => {
    const prefix = outputPrefix.trim();
    if (!prefix) {
      setOpError({
        userMessage: "Output prefix is required.",
        retryable: false,
        isNotFound: false,
        isValidation: true,
        isPermission: false,
        isServiceDown: false,
      });
      return;
    }
    setOpError(null);
    setSubmitting(true);
    try {
      const vql = JSON.parse(JSON.stringify(vqlForExport)) as Record<
        string,
        unknown
      >;
      const job = await companiesService.exportCompanies({
        service: COMPANY_EXPORT_SERVICE,
        outputPrefix: prefix,
        vql,
      });
      setActiveJobId(job.jobId);
      startPolling(job.jobId, job.status);
      toast.success("Export job started", {
        description: `Job ${job.jobId} — status: ${job.status}`,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Export companies" size="md">
      <div className="c360-section-stack">
        <Alert variant="info" title="Company export">
          Exports companies matching your current filters. Large exports may
          take several minutes.
        </Alert>

        {opError && (
          <Alert
            variant={opError.isValidation ? "warning" : "danger"}
            title={
              opError.isServiceDown
                ? "Service unavailable"
                : opError.isValidation
                  ? "Validation error"
                  : "Export failed"
            }
            onClose={() => setOpError(null)}
          >
            {opError.userMessage}
            {opError.retryable && (
              <Button
                variant="ghost"
                size="sm"
                className="c360-mt-2"
                onClick={() => void handleSubmit()}
              >
                Retry
              </Button>
            )}
          </Alert>
        )}

        <Input
          label="Output prefix *"
          value={outputPrefix}
          onChange={(e) => setOutputPrefix(e.target.value)}
          placeholder="s3/prefix/path"
          helperText="S3 key prefix for exported files."
        />

        <details className="c360-text-sm">
          <summary className="c360-cursor-pointer c360-mb-2">
            VQL preview (JSON)
          </summary>
          <pre className="c360-p-3 c360-rounded c360-text-xs c360-vql-json-preview">
            {JSON.stringify(vqlForExport, null, 2)}
          </pre>
        </details>

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
              label="Export progress"
              showValue={progressValue > 0}
            />
          </div>
        )}

        <div className="c360-modal-actions">
          <Button variant="secondary" onClick={onClose}>
            {activeJobId && isTerminal ? "Done" : "Cancel"}
          </Button>
          {!activeJobId && (
            <Button
              loading={submitting}
              leftIcon={<Download size={14} />}
              onClick={() => void handleSubmit()}
              disabled={!outputPrefix.trim()}
            >
              Start export
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

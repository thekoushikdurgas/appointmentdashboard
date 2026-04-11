"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  draftToVqlQueryInput,
  emptyDraftQuery,
  type DraftQuery,
} from "@/lib/vqlDraft";
import { getFieldsForEntity } from "@/lib/vqlFieldMeta";
import { VqlColumnPicker } from "@/components/vql/VqlColumnPicker";
import { ExportJobStatusStepper } from "@/components/shared/ExportJobStatusStepper";

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
  const [step, setStep] = useState<"columns" | "submit">("columns");
  const [colDraft, setColDraft] = useState<DraftQuery>(() => emptyDraftQuery());
  const [outputPrefix, setOutputPrefix] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [opError, setOpError] = useState<ReturnType<
    typeof parseOperationError
  > | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { jobStatus, jobProgress, polling, isTerminal, startPolling, reset } =
    useJobPoller();

  useEffect(() => {
    if (!isOpen) return;
    setStep("columns");
    setOutputPrefix(
      `companies-export-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}`,
    );
    setOpError(null);
    setActiveJobId(null);
    reset();
    const d = emptyDraftQuery();
    d.selectColumns = getFieldsForEntity("company")
      .filter((f) => !f.filterOnly)
      .map((f) => f.key);
    setColDraft(d);
  }, [isOpen, reset]);

  const mergedVql = useMemo(() => {
    const extra = draftToVqlQueryInput(colDraft, "company");
    return {
      ...vqlForExport,
      ...extra,
      limit: vqlForExport.limit,
      offset: 0,
      searchAfter: undefined,
    } as VqlQueryInput;
  }, [vqlForExport, colDraft]);

  const exportFailed =
    !!jobStatus &&
    /fail|error|cancel/i.test(jobStatus) &&
    !/completed|succeed|done|success/i.test(jobStatus);

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
      const vql = JSON.parse(JSON.stringify(mergedVql)) as Record<
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

  const progressValue = isTerminal
    ? exportFailed
      ? Math.min(100, jobProgress ?? 0)
      : 100
    : jobProgress != null && jobProgress > 0
      ? jobProgress
      : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export companies" size="md">
      <div className="c360-section-stack">
        <Alert variant="info" title="Company export">
          Exports companies matching your current filters. Large exports may
          take several minutes.
        </Alert>

        {step === "columns" ? (
          <>
            <p className="c360-text-sm c360-font-medium">1. Columns</p>
            <VqlColumnPicker
              entityType="company"
              selected={colDraft.selectColumns}
              onChange={(cols) =>
                setColDraft({ ...colDraft, selectColumns: cols })
              }
              companyPopulate={false}
              companySelectColumns={[]}
              onCompanyPopulateChange={() => {}}
            />
          </>
        ) : null}

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

        {step === "submit" ? (
          <>
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
                {JSON.stringify(mergedVql, null, 2)}
              </pre>
            </details>
          </>
        ) : null}

        {activeJobId ? (
          <div>
            <ExportJobStatusStepper
              jobStatus={jobStatus}
              failed={exportFailed}
            />
            <p className="c360-text-sm c360-mb-2">
              Job <code>{activeJobId}</code>
              {jobStatus ? ` — ${jobStatus}` : ""}
            </p>
            <ProgressBar
              value={progressValue}
              tone={
                isTerminal ? (exportFailed ? "danger" : "success") : "primary"
              }
              animated={polling && !isTerminal && progressValue === 0}
              label="Export progress"
              showValue={progressValue > 0}
            />
          </div>
        ) : null}

        <div className="c360-modal-actions">
          <Button variant="secondary" onClick={onClose}>
            {activeJobId && isTerminal ? "Done" : "Cancel"}
          </Button>
          {!activeJobId && step === "columns" ? (
            <Button type="button" onClick={() => setStep("submit")}>
              Next
            </Button>
          ) : null}
          {!activeJobId && step === "submit" ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("columns")}
              >
                Back
              </Button>
              <Button
                loading={submitting}
                leftIcon={<Download size={14} />}
                onClick={() => void handleSubmit()}
                disabled={!outputPrefix.trim()}
              >
                Start export
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { Download } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { contactsService } from "@/services/graphql/contactsService";
import { useJobPoller } from "@/hooks/useJobPoller";
import { parseOperationError } from "@/lib/errorParser";
import { toast } from "sonner";
import type { VqlQueryInput } from "@/graphql/generated/types";
import type { ContactsDataTableColumnId } from "@/components/feature/contacts/ContactsDataTable";
import {
  defaultCompanySelectWhenPopulate,
  selectColumnsFromVisibleColumns,
  visibleColumnsNeedCompanyPopulate,
} from "@/lib/contactsColumnVql";
import {
  draftToVqlQueryInput,
  emptyDraftQuery,
  type DraftQuery,
} from "@/lib/vqlDraft";
import { VqlColumnPicker } from "@/components/vql/VqlColumnPicker";
import { ExportJobStatusStepper } from "@/components/shared/ExportJobStatusStepper";

const CONTACT_EXPORT_SERVICE = "contact";

export interface ContactExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** VQL payload for the export job (filters, sort, etc.). */
  vqlForExport: VqlQueryInput;
  /** Visible table columns — used to pre-fill ``select_columns``. */
  visibleColumnIds?: ContactsDataTableColumnId[];
}

export function ContactExportModal({
  isOpen,
  onClose,
  vqlForExport,
  visibleColumnIds,
}: ContactExportModalProps) {
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
      `contacts-export-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}`,
    );
    setOpError(null);
    setActiveJobId(null);
    reset();
    const d = emptyDraftQuery();
    if (visibleColumnIds?.length) {
      d.selectColumns = selectColumnsFromVisibleColumns(visibleColumnIds);
      d.companyPopulate = visibleColumnsNeedCompanyPopulate(visibleColumnIds);
      d.companySelectColumns = d.companyPopulate
        ? defaultCompanySelectWhenPopulate()
        : [];
    }
    setColDraft(d);
  }, [isOpen, reset, visibleColumnIds]);

  const mergedVql = useMemo(() => {
    const extra = draftToVqlQueryInput(colDraft, "contact");
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
      const job = await contactsService.exportContacts({
        service: CONTACT_EXPORT_SERVICE,
        outputPrefix: prefix,
        vql,
      });
      setActiveJobId(job.jobId);
      startPolling(job.jobId, job.status);
      toast.success("Export job started", {
        description: `Job ${job.jobId} — status: ${job.status}`,
      });
    } catch (e) {
      const parsed = parseOperationError(e, "contacts");
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
    <Modal isOpen={isOpen} onClose={onClose} title="Export contacts" size="md">
      <div className="c360-section-stack">
        <Alert variant="info" title="Contact export">
          Exports contacts matching your current filters (VQL). Large exports
          may take several minutes.
        </Alert>

        {step === "columns" ? (
          <>
            <p className="c360-text-sm c360-font-medium">1. Columns</p>
            <VqlColumnPicker
              entityType="contact"
              selected={colDraft.selectColumns}
              onChange={(cols) =>
                setColDraft({ ...colDraft, selectColumns: cols })
              }
              companyPopulate={colDraft.companyPopulate}
              companySelectColumns={colDraft.companySelectColumns}
              onCompanyPopulateChange={(pop, cols) =>
                setColDraft({
                  ...colDraft,
                  companyPopulate: pop,
                  companySelectColumns: cols,
                })
              }
            />
          </>
        ) : null}

        {opError && (
          <Alert
            variant={
              opError.isValidation
                ? "warning"
                : opError.isServiceDown
                  ? "danger"
                  : "danger"
            }
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
              helperText="Used as the S3 key prefix for exported files."
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

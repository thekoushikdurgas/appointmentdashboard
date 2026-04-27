"use client";

import { Loader2, Download, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useJobDetail } from "@/hooks/useJobDetail";
import type { Job } from "@/services/graphql/jobsService";
import { toast } from "sonner";
import {
  EXPORT_STREAM_JOB_TYPES,
  exportOutputBasePathForDisplay,
  getJobProgressBarTone,
  isSuccessfulTerminalJobStatus,
  logicalJobOutputDisplayPath,
  canDownloadSchedulerOutput,
  schedulerOutputDownloadLabel,
} from "@/lib/jobs/jobsUtils";

export function JobDetailPanel({
  jobId,
  onDownload,
}: {
  jobId: string;
  onDownload: (job: Job) => void | Promise<void>;
}) {
  const { job, loading, error, polling } = useJobDetail(jobId);

  if (loading && !job) {
    return (
      <div className="c360-job-detail-panel">
        <Loader2 size={14} className="spinning" />
        <span className="c360-text-muted c360-text-sm">Loading details…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="c360-job-detail-panel">
        <span className="c360-text-danger c360-text-sm">{error}</span>
      </div>
    );
  }
  if (!job) return null;

  const progressValue =
    isSuccessfulTerminalJobStatus(job.status) && job.progress === 0
      ? 100
      : job.progress;
  const canDownload = canDownloadSchedulerOutput(job);

  const exportFolderDisplay = exportOutputBasePathForDisplay(job);
  const outputDisplayPath = logicalJobOutputDisplayPath(job);
  const outputRelativeKey = job.outputFile?.trim();
  const showRelativeKeyHint =
    outputDisplayPath &&
    outputRelativeKey &&
    outputDisplayPath !== outputRelativeKey;

  return (
    <div className="c360-job-detail-panel">
      {(polling || canDownload) && (
        <div
          className={cn(
            "c360-flex c360-flex-wrap c360-items-center c360-gap-2 c360-mb-2",
            polling && canDownload && "c360-justify-between",
            canDownload && !polling && "c360-justify-end",
          )}
        >
          {polling && (
            <span className="c360-job-detail-polling c360-mb-0">
              <Loader2 size={12} className="spinning" />
              Live polling…
            </span>
          )}
          {canDownload && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Download size={16} />}
              aria-label={`${schedulerOutputDownloadLabel(job)} via presigned URL`}
              onClick={() => void onDownload(job)}
            >
              {schedulerOutputDownloadLabel(job)}
            </Button>
          )}
        </div>
      )}
      <p className="c360-job-detail-meta-line" aria-label="Job summary">
        {[
          job.type,
          job.sourceService === "email_server"
            ? "Email"
            : job.sourceService === "sync_server"
              ? "Sync"
              : job.sourceService,
          job.jobSubtype,
          job.jobFamily,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <dl className="c360-job-detail-grid">
        <div className="c360-job-detail-full">
          <dt>Job ID</dt>
          <dd className="c360-job-detail-id-row">
            <span className="c360-font-mono c360-text-sm">{job.jobId}</span>
            <button
              type="button"
              className="c360-job-detail-copy"
              aria-label="Copy job ID"
              title="Copy job ID"
              onClick={() => {
                void navigator.clipboard.writeText(job.jobId);
                toast.success("Job ID copied");
              }}
            >
              <ClipboardCopy size={16} strokeWidth={2} />
            </button>
          </dd>
        </div>
        <div className="c360-job-detail-progress-row">
          <dt>Progress</dt>
          <dd>
            <ProgressBar
              value={progressValue}
              tone={getJobProgressBarTone(job.status)}
              showValue
              label={
                job.total > 0
                  ? `${job.processed} / ${job.total} rows`
                  : undefined
              }
              size="sm"
            />
          </dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatRelativeTime(job.createdAt)}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatRelativeTime(job.updatedAt)}</dd>
        </div>
        {job.completedAt && (
          <div>
            <dt>Completed</dt>
            <dd>{formatRelativeTime(job.completedAt)}</dd>
          </div>
        )}
        {job.inputFile && (
          <div className="c360-job-detail-full">
            <dt>Input file</dt>
            <dd className="c360-font-mono c360-text-xs">{job.inputFile}</dd>
          </div>
        )}
        {exportFolderDisplay && (
          <div className="c360-job-detail-full">
            <dt>Output path (your user id / exports)</dt>
            <dd>
              <div className="c360-font-mono c360-text-xs">
                {exportFolderDisplay}
              </div>
              <p className="c360-text-xs c360-text-muted c360-mt-1 c360-mb-0">
                Finder, verifier, pattern, and Contact360 export jobs write CSVs
                under this folder in your bucket (logical path{" "}
                <code className="c360-font-mono">{`{your-user-id}/exports/`}</code>
                ). Satellite payloads use bucket-relative{" "}
                <code className="c360-font-mono">exports/…</code>; the same
                files appear under the path above.
              </p>
            </dd>
          </div>
        )}
        {job.storedOutputPrefix && EXPORT_STREAM_JOB_TYPES.has(job.type) && (
          <div className="c360-job-detail-full">
            <dt>Output prefix (stored on job)</dt>
            <dd className="c360-font-mono c360-text-xs">
              {job.storedOutputPrefix}
            </dd>
          </div>
        )}
        {job.outputFile && (
          <div className="c360-job-detail-full">
            <dt>Output file</dt>
            <dd className="c360-job-detail-output">
              <span className="c360-font-mono c360-text-xs">
                {outputDisplayPath ?? job.outputFile}
              </span>
              {showRelativeKeyHint && (
                <p className="c360-text-xs c360-text-muted c360-mt-1 c360-mb-0">
                  Same CSV — not a different file. The path above shows your
                  storage id plus the object key so it matches how folders are
                  shown above. Download and presign use the bucket-relative key{" "}
                  <code className="c360-font-mono c360-text-xs">
                    {outputRelativeKey}
                  </code>{" "}
                  (your user id is already the bucket scope, so the key omits
                  it).
                </p>
              )}
            </dd>
          </div>
        )}
        {job.error && (
          <div className="c360-job-detail-full">
            <dt>Error</dt>
            <dd className="c360-text-danger c360-text-xs">{job.error}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Loader2,
  Plus,
  Download,
  FileKey,
  ClipboardCopy,
} from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ReviewList } from "@/components/shared/ReviewList";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useJobs } from "@/hooks/useJobs";
import { useJobDetail } from "@/hooks/useJobDetail";
import { jobsService } from "@/services/graphql/jobsService";
import { s3Service } from "@/services/graphql/s3Service";
import { StartJobFromS3Modal } from "@/components/feature/jobs/StartJobFromS3Modal";
import { JobsDataTable } from "@/components/feature/jobs/JobsDataTable";
import { toast } from "sonner";
import { parseOperationError } from "@/lib/errorParser";
import {
  EXPORT_STREAM_JOB_TYPES,
  exportOutputBasePathForDisplay,
  getJobProgressBarTone,
  isSuccessfulTerminalJobStatus,
  logicalJobOutputDisplayPath,
} from "@/lib/jobs/jobsUtils";
import {
  normalizeExportOutputPrefix,
  stripStorageIdOutputPrefix,
} from "@/lib/jobs/exportOutputPrefix";

const EXPORT_TYPE_OPTIONS = [
  { value: "contacts", label: "Contacts" },
  { value: "companies", label: "Companies" },
  { value: "email_finder", label: "Email Finder" },
  { value: "email_verify", label: "Email Verify" },
  { value: "email_pattern", label: "Email Pattern" },
];

const JOB_FAMILY_OPTIONS = [
  { value: "", label: "All Families" },
  { value: "email_job", label: "Email Jobs" },
  { value: "contact_job", label: "Contact Jobs" },
  { value: "company_job", label: "Company Jobs" },
];

function openUrlInNewTabPreservingUserGesture(url: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function exportCsvFilenameFromKey(outputKey: string): string {
  const tail = outputKey.includes("/")
    ? outputKey.slice(outputKey.lastIndexOf("/") + 1)
    : outputKey;
  const t = tail.trim();
  if (!t) return "export.csv";
  return t.toLowerCase().endsWith(".csv") ? t : `${t}.csv`;
}

/**
 * Prefer blob download via fetch when S3 CORS allows it (reliable file save).
 * Falls back to opening the presigned URL in a new tab.
 */
async function openSchedulerExportDownload(output: string): Promise<void> {
  const o = output.trim();
  if (/^https?:\/\//i.test(o)) {
    openUrlInNewTabPreservingUserGesture(o);
    return;
  }
  try {
    const data = await s3Service.getDownloadUrl(o);
    const url = data.s3?.s3FileDownloadUrl?.downloadUrl;
    if (typeof url !== "string" || url.length === 0) {
      toast.error("Could not get download link for this file.");
      return;
    }

    const safeName = exportCsvFilenameFromKey(o);

    try {
      const res = await fetch(url, { method: "GET", mode: "cors" });
      if (res.ok) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      } else {
        toast.error(
          `Could not download file (storage HTTP ${res.status}). It may be missing or permissions may deny access.`,
        );
        openUrlInNewTabPreservingUserGesture(url);
      }
    } catch {
      openUrlInNewTabPreservingUserGesture(url);
    }
  } catch (e) {
    toast.error(parseOperationError(e, "storage").userMessage);
  }
}

function JobDetailPanel({
  jobId,
  onDownload,
}: {
  jobId: string;
  onDownload: (output: string) => void | Promise<void>;
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
  const canDownload =
    !!job.outputFile?.trim() && isSuccessfulTerminalJobStatus(job.status);

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
              aria-label="Download CSV via presigned URL"
              onClick={() => void onDownload(job.outputFile!)}
            >
              Download CSV
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
        {job.storedOutputPrefix &&
          EXPORT_STREAM_JOB_TYPES.has(job.type) && (
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

export default function JobsPage() {
  const { user } = useAuth();
  const storageId = user?.id?.trim() ?? null;
  const [familyFilter, setFamilyFilter] = useState("");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const {
    jobs,
    loading,
    isRefreshing,
    error,
    refresh,
    retry,
    pause,
    resume,
    cancel,
    pauseConnectra,
    resumeConnectra,
    terminateConnectra,
  } = useJobs({ jobFamily: familyFilter || undefined }, { cachedList: true });
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [s3JobOpen, setS3JobOpen] = useState(false);
  const [exportType, setExportType] = useState("contacts");
  const [creating, setCreating] = useState(false);
  /** S3 object key after Upload module upload (email finder / verify CSV jobs). */
  const [emailInputCsvKey, setEmailInputCsvKey] = useState("");
  const [emailOutputPrefix, setEmailOutputPrefix] = useState("exports/");
  const [patternCompanyUuidCol, setPatternCompanyUuidCol] =
    useState("company_uuid");
  const [patternEmailCol, setPatternEmailCol] = useState("email");
  const [patternFirstNameCol, setPatternFirstNameCol] = useState("first_name");
  const [patternLastNameCol, setPatternLastNameCol] = useState("last_name");
  const [patternDomainCol, setPatternDomainCol] = useState("domain");
  /** Contact360 export (sync.server): matches `CreateContact360ExportInput`. */
  const [c360OutputPrefix, setC360OutputPrefix] = useState("exports/");
  const [c360VqlJson, setC360VqlJson] = useState("{}");

  /** New Export modal: default field to full logical ``{userId}/exports/`` once id is known. */
  useEffect(() => {
    if (!exportOpen || !storageId) return;
    setEmailOutputPrefix((p) =>
      p.trim() === "exports/" ? `${storageId}/exports/` : p,
    );
    setC360OutputPrefix((p) =>
      p.trim() === "exports/" ? `${storageId}/exports/` : p,
    );
  }, [exportOpen, storageId]);

  const handleCreateExport = async () => {
    setCreating(true);
    try {
      if (exportType === "email_finder") {
        if (!emailInputCsvKey.trim() || !emailOutputPrefix.trim()) {
          toast.error(
            "Set input CSV S3 key and output prefix (upload a CSV first).",
          );
          return;
        }
        let outputPrefix: string;
        try {
          outputPrefix = normalizeExportOutputPrefix(
            stripStorageIdOutputPrefix(emailOutputPrefix, storageId),
          );
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Invalid S3 output prefix.",
          );
          return;
        }
        await jobsService.createEmailFinderExport({
          inputCsvKey: emailInputCsvKey.trim(),
          outputPrefix,
        });
      } else if (exportType === "email_verify") {
        if (!emailInputCsvKey.trim() || !emailOutputPrefix.trim()) {
          toast.error(
            "Set input CSV S3 key and output prefix (upload a CSV first).",
          );
          return;
        }
        let outputPrefix: string;
        try {
          outputPrefix = normalizeExportOutputPrefix(
            stripStorageIdOutputPrefix(emailOutputPrefix, storageId),
          );
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Invalid S3 output prefix.",
          );
          return;
        }
        await jobsService.createEmailVerifyExport({
          inputCsvKey: emailInputCsvKey.trim(),
          outputPrefix,
        });
      } else if (exportType === "email_pattern") {
        if (!emailInputCsvKey.trim() || !emailOutputPrefix.trim()) {
          toast.error(
            "Set input CSV S3 key and output prefix (upload a CSV first).",
          );
          return;
        }
        let outputPrefix: string;
        try {
          outputPrefix = normalizeExportOutputPrefix(
            stripStorageIdOutputPrefix(emailOutputPrefix, storageId),
          );
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Invalid S3 output prefix.",
          );
          return;
        }
        await jobsService.createEmailPatternExport({
          inputCsvKey: emailInputCsvKey.trim(),
          outputPrefix,
          csvColumns: {
            companyUuid: patternCompanyUuidCol.trim() || "company_uuid",
            email: patternEmailCol.trim() || "email",
            firstName: patternFirstNameCol.trim() || "first_name",
            lastName: patternLastNameCol.trim() || "last_name",
            domain: patternDomainCol.trim() || "domain",
          },
        });
      } else {
        let vql: Record<string, unknown>;
        try {
          vql = JSON.parse(c360VqlJson.trim() || "{}") as Record<
            string,
            unknown
          >;
        } catch {
          toast.error("VQL must be valid JSON.");
          return;
        }
        if (!c360OutputPrefix.trim()) {
          toast.error("Set an output prefix for the export.");
          return;
        }
        let outputPrefix: string;
        try {
          outputPrefix = normalizeExportOutputPrefix(
            stripStorageIdOutputPrefix(c360OutputPrefix, storageId),
          );
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Invalid S3 output prefix.",
          );
          return;
        }
        const service = exportType === "companies" ? "company" : "contact";
        await jobsService.createContact360Export({
          outputPrefix,
          service,
          vql,
        });
      }
      toast.success("Export job created successfully!");
      setExportOpen(false);
      refresh();
    } catch (e) {
      toast.error(parseOperationError(e, "jobs").userMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardPageLayout>
      <div className="c360-page-header">
        <div>
          <h1 className="c360-page-header__title">Jobs</h1>
          <p className="c360-page-header__subtitle">
            Monitor and manage your background processing jobs
          </p>
        </div>
        <div className="c360-flex c360-gap-2 c360-items-center">
          <Select
            options={JOB_FAMILY_OPTIONS}
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            fullWidth={false}
            className="c360-jobs-family-select"
          />
          <Button
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => setExportOpen(true)}
          >
            New Export
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FileKey size={16} />}
            onClick={() => setS3JobOpen(true)}
          >
            From S3 file
          </Button>
          <Button
            variant="secondary"
            leftIcon={
              <RefreshCw size={16} className={cn(loading && "c360-spin")} />
            }
            size="sm"
            onClick={() => refresh()}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error &&
        (() => {
          const opErr = parseOperationError(error, "jobs");
          return (
            <Alert
              variant={opErr.isServiceDown ? "danger" : "danger"}
              title={
                opErr.isServiceDown
                  ? "Service unavailable"
                  : "Failed to load jobs"
              }
              className="c360-mb-4"
            >
              {opErr.userMessage}
              {opErr.retryable && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="c360-mt-2"
                  onClick={() => refresh()}
                >
                  Retry
                </Button>
              )}
            </Alert>
          );
        })()}

      <Card
        title="Jobs"
        subtitle={
          isRefreshing
            ? "Refreshing…"
            : loading
              ? "Loading…"
              : `${jobs.length} job${jobs.length !== 1 ? "s" : ""}${
                  familyFilter
                    ? ` · filter: ${JOB_FAMILY_OPTIONS.find((o) => o.value === familyFilter)?.label ?? familyFilter}`
                    : ""
                }`
        }
        padding="none"
      >
        <div className="c360-p-4">
          <JobsDataTable
            jobs={jobs}
            loading={loading}
            expandedJobId={expandedJobId}
            onToggleExpand={(jobId) =>
              setExpandedJobId((cur) => (cur === jobId ? null : jobId))
            }
            retryingJobId={retryingJobId}
            onRetry={async (jobId) => {
              setRetryingJobId(jobId);
              try {
                await retry(jobId);
              } finally {
                setRetryingJobId(null);
              }
            }}
            onPause={(jobId) => void pause(jobId)}
            onPauseConnectra={(jobId) => void pauseConnectra(jobId)}
            onCancel={(jobId) => void cancel(jobId)}
            onTerminateConnectra={(jobId) => void terminateConnectra(jobId)}
            onResume={(jobId) => void resume(jobId)}
            onResumeConnectra={(jobId) => void resumeConnectra(jobId)}
            onDownloadOutput={(output) =>
              void openSchedulerExportDownload(output)
            }
            renderDetailPanel={(jobId) => (
              <JobDetailPanel
                jobId={jobId}
                onDownload={openSchedulerExportDownload}
              />
            )}
          />
        </div>
      </Card>

      {/* Job reviews */}
      <div className="c360-mt-6">
        <Card title="Job Reviews" subtitle="User feedback on batch jobs">
          <ReviewList reviews={[]} entityName="jobs" />
        </Card>
      </div>

      {/* New Export Modal */}
      <Modal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Create Export Job"
        size="sm"
      >
        <div className="c360-section-stack">
          <Select
            label="Export type"
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            options={EXPORT_TYPE_OPTIONS}
          />
          {(exportType === "email_finder" ||
            exportType === "email_verify" ||
            exportType === "email_pattern") && (
            <>
              <Input
                label="S3 input CSV key"
                value={emailInputCsvKey}
                onChange={(e) => setEmailInputCsvKey(e.target.value)}
                placeholder="uploads/abc.csv"
              />
              <Input
                label="S3 output prefix (your storage id + folder)"
                value={emailOutputPrefix}
                onChange={(e) => setEmailOutputPrefix(e.target.value)}
                placeholder={storageId ? `${storageId}/exports/` : "exports/"}
              />
              <p className="c360-text-xs c360-text-muted c360-mt-1">
                Default matches Jobs:{" "}
                <code className="c360-font-mono c360-break-all">
                  {storageId ? `${storageId}/exports/` : "…/exports/"}
                </code>
                . On create, your id is stripped and a bucket-relative prefix is
                sent (normalized like the API).
              </p>
              {exportType === "email_pattern" && (
                <div className="c360-section-stack c360-text-sm">
                  <p className="c360-text-xs c360-text-muted c360-mb-2">
                    CSV column headers (override if your file differs)
                  </p>
                  <Input
                    label="Company UUID column"
                    value={patternCompanyUuidCol}
                    onChange={(e) => setPatternCompanyUuidCol(e.target.value)}
                    placeholder="company_uuid"
                    inputSize="sm"
                  />
                  <Input
                    label="Email column"
                    value={patternEmailCol}
                    onChange={(e) => setPatternEmailCol(e.target.value)}
                    placeholder="email"
                    inputSize="sm"
                  />
                  <Input
                    label="First name column"
                    value={patternFirstNameCol}
                    onChange={(e) => setPatternFirstNameCol(e.target.value)}
                    placeholder="first_name"
                    inputSize="sm"
                  />
                  <Input
                    label="Last name column"
                    value={patternLastNameCol}
                    onChange={(e) => setPatternLastNameCol(e.target.value)}
                    placeholder="last_name"
                    inputSize="sm"
                  />
                  <Input
                    label="Domain column"
                    value={patternDomainCol}
                    onChange={(e) => setPatternDomainCol(e.target.value)}
                    placeholder="domain"
                    inputSize="sm"
                  />
                </div>
              )}
              <p className="c360-text-xs c360-text-muted">
                Upload the CSV via the Upload flow, then paste the returned file
                key. Poll progress with <code>email.emailJobStatus</code> or
                open this job under Jobs.
              </p>
            </>
          )}
          {(exportType === "contacts" || exportType === "companies") && (
            <>
              <Input
                label="S3 output prefix (your storage id + folder)"
                value={c360OutputPrefix}
                onChange={(e) => setC360OutputPrefix(e.target.value)}
                placeholder={storageId ? `${storageId}/exports/` : "exports/"}
              />
              <p className="c360-text-xs c360-text-muted c360-mt-1">
                Same as email exports: default{" "}
                <code className="c360-font-mono c360-break-all">
                  {storageId ? `${storageId}/exports/` : "…/exports/"}
                </code>
                ; id is stripped before normalize on create.
              </p>
              <Tabs defaultValue="quick">
                <TabsList>
                  <TabsTrigger value="quick">Quick</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                <TabsContent value="quick">
                  <div className="c360-section-stack c360-pt-2">
                    <p className="c360-text-xs c360-text-muted">
                      Export all {exportType} with no additional VQL filter. The
                      output prefix above will be used as the S3 key prefix.
                    </p>
                    <p className="c360-text-xs c360-text-muted">
                      Effective VQL: <code>{"{}"}</code>
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="advanced">
                  <div className="c360-section-stack c360-pt-2">
                    <div className="c360-field">
                      <label className="c360-label" htmlFor="jobs-c360-vql">
                        VQL (JSON)
                      </label>
                      <textarea
                        id="jobs-c360-vql"
                        className="c360-input c360-font-mono"
                        rows={5}
                        value={c360VqlJson}
                        onChange={(e) => setC360VqlJson(e.target.value)}
                        placeholder="{}"
                      />
                    </div>
                    <p className="c360-text-xs c360-text-muted">
                      Adjust VQL to match your saved search. Uses{" "}
                      <code>createContact360Export</code>.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
          <div className="c360-modal-actions">
            <Button variant="secondary" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={creating}
              leftIcon={<Download size={14} />}
              onClick={handleCreateExport}
            >
              Create Export
            </Button>
          </div>
        </div>
      </Modal>

      {s3JobOpen ? (
        <StartJobFromS3Modal
          isOpen
          onClose={() => setS3JobOpen(false)}
          onJobCreated={() => refresh()}
        />
      ) : null}
    </DashboardPageLayout>
  );
}

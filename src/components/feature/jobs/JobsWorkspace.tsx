"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Plus, Download, FileKey } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ReviewList } from "@/components/shared/ReviewList";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useReviewDrawer } from "@/context/ReviewDrawerContext";
import { useJobs } from "@/hooks/useJobs";
import { jobsService } from "@/services/graphql/jobsService";
import { StartJobFromS3Modal } from "@/components/feature/jobs/StartJobFromS3Modal";
import { JobsDataTable } from "@/components/feature/jobs/JobsDataTable";
import { toast } from "sonner";
import { parseOperationError } from "@/lib/errorParser";
import { openSchedulerExportDownload } from "@/components/feature/jobs/jobDownload";
import { JobDetailPanel } from "@/components/feature/jobs/JobDetailPanel";
import {
  EXPORT_TYPE_OPTIONS,
  JOB_FAMILY_OPTIONS,
} from "@/components/feature/jobs/jobsWorkspaceConsts";
import {
  normalizeExportOutputPrefix,
  stripStorageIdOutputPrefix,
} from "@/lib/jobs/exportOutputPrefix";

export interface JobsWorkspaceProps {
  /** When set on mount, pre-selects the job family filter (e.g. hire_signal). */
  initialJobFamily?: string;
  /** Omit outer “Job reviews” card (e.g. compact drawer). */
  showJobReviews?: boolean;
  className?: string;
}

export function JobsWorkspace({
  initialJobFamily = "",
  showJobReviews = true,
  className,
}: JobsWorkspaceProps) {
  const { user } = useAuth();
  const { openReviewDrawer } = useReviewDrawer();
  const storageId = user?.id?.trim() ?? null;
  const [familyFilter, setFamilyFilter] = useState(initialJobFamily);
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
  const [emailInputCsvKey, setEmailInputCsvKey] = useState("");
  const [emailOutputPrefix, setEmailOutputPrefix] = useState("exports/");
  const [patternCompanyUuidCol, setPatternCompanyUuidCol] =
    useState("company_uuid");
  const [patternEmailCol, setPatternEmailCol] = useState("email");
  const [patternFirstNameCol, setPatternFirstNameCol] = useState("first_name");
  const [patternLastNameCol, setPatternLastNameCol] = useState("last_name");
  const [patternDomainCol, setPatternDomainCol] = useState("domain");
  const [c360OutputPrefix, setC360OutputPrefix] = useState("exports/");
  const [c360VqlJson, setC360VqlJson] = useState("{}");

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
    <div className={cn("c360-jobs-workspace", className)}>
      <div className="c360-flex c360-flex-wrap c360-items-center c360-justify-between c360-gap-3 c360-mb-4">
        <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2">
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
        <div className="c360-p-4 c360-min-w-0 c360-overflow-x-auto">
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
            onDownloadOutput={(j) => void openSchedulerExportDownload(j)}
            onOpenJobTicket={(j) =>
              openReviewDrawer({
                preset: {
                  externalJobId: j.jobId,
                  jobSource: "scheduler",
                },
              })
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

      {showJobReviews ? (
        <div className="c360-mt-6">
          <Card title="Job Reviews" subtitle="User feedback on batch jobs">
            <ReviewList reviews={[]} entityName="jobs" />
          </Card>
        </div>
      ) : null}

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
    </div>
  );
}

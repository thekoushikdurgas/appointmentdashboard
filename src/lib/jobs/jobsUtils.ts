import type { Job } from "@/services/graphql/jobsService";

/** Satellite job types that write CSV under ``{userId}/{output_prefix}/`` (default ``exports/``). */
export const EXPORT_STREAM_JOB_TYPES = new Set([
  "email_finder_export_stream",
  "email_verify_export_stream",
  "email_pattern_export_stream",
  "contact360_export_stream",
]);

/**
 * Logical export folder: API field when present, else ``{userId}/exports/`` for stream export jobs.
 */
export function exportOutputBasePathForDisplay(
  job: Pick<Job, "userId" | "type" | "exportOutputBasePath">,
): string | undefined {
  const fromApi = job.exportOutputBasePath?.trim();
  if (fromApi) return fromApi;
  const uid = job.userId?.trim();
  if (!uid || !EXPORT_STREAM_JOB_TYPES.has(job.type)) return undefined;
  return `${uid}/exports/`;
}

/**
 * Full logical path under the user's storage id for export jobs (UI only).
 * Presign/download must keep using the relative ``outputFile`` from the API.
 */
export function logicalJobOutputDisplayPath(
  job: Pick<Job, "userId" | "outputFile" | "exportOutputBasePath" | "type">,
): string | undefined {
  const raw = job.outputFile?.trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!exportOutputBasePathForDisplay(job)) return raw;
  const uid = job.userId.trim();
  if (uid && raw.startsWith(`${uid}/`)) return raw;
  return `${uid}/${raw}`;
}

/** True when the job reached a successful terminal state (incl. Connectra ``succeeded``). */
export function isSuccessfulTerminalJobStatus(displayStatus: string): boolean {
  const u = displayStatus.toUpperCase();
  return (
    u === "COMPLETED" ||
    u === "COMPLETE" ||
    u === "SUCCEEDED" ||
    u === "SUCCESS" ||
    u === "DONE"
  );
}

/**
 * List rows often only have DB ``status`` + stale/minimal ``statusPayload`` (no percent).
 * Map successful terminal jobs to 100% so the bar and badge match user expectations.
 */
export function deriveDisplayProgressPercent(
  displayStatus: string,
  parsed: { progress: number; total: number; processed: number },
): number {
  const s = displayStatus.toUpperCase();
  if (s === "FAILED" || s === "CANCELLED" || s === "CANCELED") {
    return Math.min(100, Math.max(0, parsed.progress));
  }
  if (isSuccessfulTerminalJobStatus(displayStatus)) {
    if (parsed.total > 0 && parsed.processed > 0) {
      return Math.min(100, Math.round((parsed.processed / parsed.total) * 100));
    }
    if (parsed.progress > 0) return Math.min(100, parsed.progress);
    return 100;
  }
  if (parsed.total > 0) {
    return Math.min(100, Math.round((parsed.processed / parsed.total) * 100));
  }
  return Math.min(100, Math.max(0, parsed.progress));
}

/** Short UUID for dense tables: no leading punctuation that reads as “--”. */
export function formatJobIdShort(jobId: string): string {
  const u = (jobId || "").trim();
  if (u.length <= 16) return u || "—";
  return `${u.slice(0, 8)}…${u.slice(-6)}`;
}

export type JobProgressBarTone = "primary" | "success" | "warning" | "danger";

/** Maps scheduler status to ``ProgressBar`` / ``Progress`` tone (incl. ``succeeded`` → success). */
export function getJobProgressBarTone(status: string): JobProgressBarTone {
  const u = status.toUpperCase();
  if (u === "FAILED") return "danger";
  if (isSuccessfulTerminalJobStatus(status)) return "success";
  if (u === "PAUSED") return "warning";
  return "primary";
}

export function getJobProgressColor(job: Job): string {
  if (job.status === "FAILED") return "var(--c360-danger)";
  if (isSuccessfulTerminalJobStatus(job.status)) return "var(--c360-success)";
  if (job.status === "PAUSED") return "var(--c360-warning)";
  return "var(--c360-primary)";
}

export function getJobBadgeColor(
  status: string,
): "blue" | "green" | "red" | "orange" | "gray" {
  switch (status) {
    case "RUNNING":
      return "blue";
    case "COMPLETED":
      return "green";
    case "FAILED":
      return "red";
    case "PAUSED":
      return "orange";
    default:
      return "gray";
  }
}

/** XLSX exports tracked under scheduler_jobs (`hire_signal` / job.server). */
export function isHireSignalXlsxExportJob(
  job: Pick<Job, "type" | "sourceService">,
): boolean {
  return (
    job.type === "hire_signal_xlsx_export" && job.sourceService === "job_server"
  );
}

/** Whether the Jobs UI can offer a presigned download for this row. */
export function canDownloadSchedulerOutput(
  job: Pick<Job, "status" | "outputFile" | "type" | "sourceService">,
): boolean {
  if (!isSuccessfulTerminalJobStatus(job.status)) return false;
  if (isHireSignalXlsxExportJob(job)) return true;
  return !!job.outputFile?.trim();
}

export function schedulerOutputDownloadLabel(
  job: Pick<Job, "type" | "sourceService">,
): "Download XLSX" | "Download CSV" {
  return isHireSignalXlsxExportJob(job) ? "Download XLSX" : "Download CSV";
}

/**
 * Filename hint for blob / anchor download (CSV export jobs vs hiring-signal XLSX).
 */
export function schedulerExportSuggestedFilename(
  job: Pick<Job, "type" | "sourceService">,
  storageKeyOrUrl: string,
): string {
  const tail = storageKeyOrUrl.includes("/")
    ? storageKeyOrUrl.slice(storageKeyOrUrl.lastIndexOf("/") + 1)
    : storageKeyOrUrl;
  const t = tail.trim();
  if (!t) {
    return isHireSignalXlsxExportJob(job)
      ? "hiring-signals-export.xlsx"
      : "export.csv";
  }
  if (isHireSignalXlsxExportJob(job)) {
    return t.toLowerCase().endsWith(".xlsx")
      ? t
      : `${t.replace(/\.[^.]+$/, "") || t}.xlsx`;
  }
  return t.toLowerCase().endsWith(".csv") ? t : `${t}.csv`;
}

export function shouldPollJob(status: string): boolean {
  /**
   * Non-terminal work states. Include PROCESSING/RETRY/PAUSED so DB-only status (no live JSON yet)
   * still uses the fast interval — otherwise ``processing``.toUpperCase() misses RUNNING and polls slowly.
   */
  return [
    "PENDING",
    "RUNNING",
    "OPEN",
    "IN_QUEUE",
    "PROCESSING",
    "RETRY",
    "PAUSED",
  ].includes(status);
}

export function getJobEta(job: Job): string | null {
  if (!["RUNNING"].includes(job.status) || job.processed === 0) return null;
  const updatedAt = new Date(job.updatedAt).getTime();
  const elapsed = Date.now() - updatedAt;
  const rate = job.processed / elapsed;
  const remaining = job.total - job.processed;
  if (rate === 0) return null;
  const etaMs = remaining / rate;
  if (etaMs < 60000) return "< 1 min";
  if (etaMs < 3600000) return `~${Math.ceil(etaMs / 60000)} min`;
  return `~${Math.ceil(etaMs / 3600000)} hr`;
}

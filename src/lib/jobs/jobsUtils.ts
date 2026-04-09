import type { Job } from "@/services/graphql/jobsService";

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

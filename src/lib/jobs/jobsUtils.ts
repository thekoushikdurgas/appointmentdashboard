import type { Job } from "@/services/graphql/jobsService";

export function getJobProgressColor(job: Job): string {
  if (job.status === "FAILED") return "var(--c360-danger)";
  if (job.status === "COMPLETED") return "var(--c360-success)";
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
  /** OPEN = scheduler DB default for new jobs; Connectra may keep reporting until live status is merged. */
  return ["PENDING", "RUNNING", "OPEN", "IN_QUEUE"].includes(status);
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

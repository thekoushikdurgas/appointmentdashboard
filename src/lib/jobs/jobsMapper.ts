import type { Job } from "@/services/graphql/jobsService";
import { isSuccessfulTerminalJobStatus } from "@/lib/jobs/jobsUtils";

export interface MappedJob extends Job {
  typeLabel: string;
  statusLabel: string;
  isTerminal: boolean;
  canRetry: boolean;
  canPause: boolean;
  canCancel: boolean;
  /** sync_server (Connectra): gateway `pauseConnectraJob(jobUuid)` — use scheduler `jobId`. */
  canPauseConnectra: boolean;
  canResumeConnectra: boolean;
  canTerminateConnectra: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  BULK_FINDER: "Bulk Email Finder",
  BULK_VERIFIER: "Bulk Email Verifier",
  LINKEDIN_EXPORT: "LinkedIn Export",
  CONTACTS_EXPORT: "Contacts Export",
  COMPANIES_EXPORT: "Companies Export",
};

const SYNC = "sync_server";
const EMAIL = "email_server";

export function mapJob(job: Job): MappedJob {
  const status = (job.status || "").toUpperCase();
  const isSync = job.sourceService === SYNC;
  const isEmail = job.sourceService === EMAIL;
  return {
    ...job,
    status,
    typeLabel: TYPE_LABELS[job.type] || job.type,
    statusLabel: status ? status.charAt(0) + status.slice(1).toLowerCase() : "",
    isTerminal:
      status === "FAILED" ||
      status === "CANCELLED" ||
      status === "CANCELED" ||
      isSuccessfulTerminalJobStatus(status),
    canRetry: status === "FAILED" && !isEmail,
    canPause: status === "RUNNING" && isEmail,
    canCancel:
      ["RUNNING", "PENDING", "PAUSED", "OPEN"].includes(status) && isEmail,
    canPauseConnectra: status === "RUNNING" && isSync,
    canResumeConnectra: status === "PAUSED" && isSync,
    canTerminateConnectra:
      ["RUNNING", "PENDING", "PAUSED", "OPEN"].includes(status) && isSync,
  };
}

export function mapJobs(jobs: Job[]): MappedJob[] {
  return jobs.map(mapJob);
}

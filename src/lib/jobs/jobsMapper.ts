import { formatStatusLabel } from "@/lib/displayText";
import type { Job } from "@/services/graphql/jobsService";
import { isSuccessfulTerminalJobStatus } from "@/lib/jobs/jobsUtils";

export interface MappedJob extends Job {
  typeLabel: string;
  statusLabel: string;
  isTerminal: boolean;
  canRetry: boolean;
  canPause: boolean;
  canCancel: boolean;
  /** sync_server: gateway `pauseConnectraJob(jobUuid)` — use scheduler `jobId`. */
  canPauseSync: boolean;
  canResumeSync: boolean;
  canTerminateSync: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  BULK_FINDER: "Bulk Email Finder",
  BULK_VERIFIER: "Bulk Email Verifier",
  LINKEDIN_EXPORT: "LinkedIn Export",
  CONTACTS_EXPORT: "Contacts Export",
  COMPANIES_EXPORT: "Companies Export",
  hire_signal_xlsx_export: "Hiring signals XLSX export",
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
    statusLabel: status ? formatStatusLabel(status) : "",
    isTerminal:
      status === "FAILED" ||
      status === "CANCELLED" ||
      status === "CANCELED" ||
      isSuccessfulTerminalJobStatus(status),
    canRetry: status === "FAILED" && !isEmail,
    canPause: status === "RUNNING" && isEmail,
    canCancel:
      ["RUNNING", "PENDING", "PAUSED", "OPEN"].includes(status) && isEmail,
    canPauseSync: status === "RUNNING" && isSync,
    canResumeSync: status === "PAUSED" && isSync,
    canTerminateSync:
      ["RUNNING", "PENDING", "PAUSED", "OPEN"].includes(status) && isSync,
  };
}

export function mapJobs(jobs: Job[]): MappedJob[] {
  return jobs.map(mapJob);
}

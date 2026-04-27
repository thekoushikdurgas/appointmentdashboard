"use client";

import { toast } from "sonner";
import { parseOperationError } from "@/lib/errorParser";
import {
  isHireSignalXlsxExportJob,
  schedulerExportSuggestedFilename,
} from "@/lib/jobs/jobsUtils";
import { fetchHireSignalExportDownloadUrl } from "@/services/graphql/hiringSignalService";
import { s3Service } from "@/services/graphql/s3Service";
import type { Job } from "@/services/graphql/jobsService";

export function openUrlInNewTabPreservingUserGesture(url: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Prefer blob download via fetch when S3 CORS allows it (reliable file save).
 * Falls back to opening the presigned URL in a new tab.
 */
export async function openSchedulerExportDownload(job: Job): Promise<void> {
  if (isHireSignalXlsxExportJob(job)) {
    try {
      const data = await fetchHireSignalExportDownloadUrl(job.jobId);
      const url = data.hireSignal?.exportDownloadUrl?.downloadUrl;
      if (typeof url !== "string" || url.length === 0) {
        toast.error(
          "Export is not ready for download yet, or the link could not be created.",
        );
        return;
      }
      const safeName = schedulerExportSuggestedFilename(
        job,
        job.outputFile || "",
      );
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
            `Could not download file (HTTP ${res.status}). Opening link in a new tab.`,
          );
          openUrlInNewTabPreservingUserGesture(url);
        }
      } catch {
        openUrlInNewTabPreservingUserGesture(url);
      }
    } catch (e) {
      toast.error(parseOperationError(e, "jobs").userMessage);
    }
    return;
  }

  const o = (job.outputFile || "").trim();
  if (!o) {
    toast.error("No output file on this job.");
    return;
  }
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

    const safeName = schedulerExportSuggestedFilename(job, o);

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

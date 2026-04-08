import type { Job } from "@/services/graphql/jobsService";

/**
 * Aggregate jobs for the Activities “Live Job Statistics” chart (3 series).
 * Status is compared case-insensitively; aligns with {@link mapJob} / gateway enums.
 */
export function jobBucketCounts(jobs: Job[]): {
  running: number;
  completed: number;
  failed: number;
} {
  let running = 0;
  let completed = 0;
  let failed = 0;
  for (const j of jobs) {
    const s = (j.status || "").toUpperCase();
    if (s === "FAILED") failed++;
    else if (s === "COMPLETED" || s === "COMPLETE" || s === "CANCELLED")
      completed++;
    else running++;
  }
  return { running, completed, failed };
}

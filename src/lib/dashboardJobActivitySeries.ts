import type { LinkedInJobRow } from "@/hooks/useHiringSignals";

export interface JobActivityPoint {
  date: string;
  posted: number;
  salaryListed: number;
}

function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortLabelFromIsoDay(isoDay: string): string {
  const [y, mo, da] = isoDay.split("-").map(Number);
  if (!y || !mo || !da) return isoDay;
  const dt = new Date(y, mo - 1, da);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Last `days` calendar days (local): job counts by `postedAt`, plus jobs that list a salary range.
 */
export function buildJobActivitySeriesFromJobs(
  jobs: ReadonlyArray<
    Pick<LinkedInJobRow, "postedAt" | "salaryMinUsd" | "salaryMaxUsd">
  >,
  days = 30,
): JobActivityPoint[] {
  const endMidnight = new Date();
  endMidnight.setHours(0, 0, 0, 0);
  const startMidnight = new Date(endMidnight);
  startMidnight.setDate(startMidnight.getDate() - (days - 1));

  const dayKeys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startMidnight);
    d.setDate(startMidnight.getDate() + i);
    dayKeys.push(toIsoDateLocal(d));
  }

  const counts = new Map<string, { posted: number; salaryListed: number }>();
  for (const k of dayKeys) {
    counts.set(k, { posted: 0, salaryListed: 0 });
  }

  const rangeEnd = new Date(endMidnight);
  rangeEnd.setHours(23, 59, 59, 999);

  for (const job of jobs) {
    if (!job.postedAt?.trim()) continue;
    const t = new Date(job.postedAt);
    if (Number.isNaN(t.getTime())) continue;
    if (t < startMidnight || t > rangeEnd) continue;
    const key = toIsoDateLocal(t);
    const b = counts.get(key);
    if (!b) continue;
    b.posted += 1;
    const hasSalary = job.salaryMinUsd != null || job.salaryMaxUsd != null;
    if (hasSalary) b.salaryListed += 1;
  }

  return dayKeys.map((iso) => {
    const b = counts.get(iso)!;
    return {
      date: shortLabelFromIsoDay(iso),
      posted: b.posted,
      salaryListed: b.salaryListed,
    };
  });
}

/** Deterministic 30-day placeholder (SSR-safe). */
export function buildJobActivityFallbackSeries(): JobActivityPoint[] {
  const n = 30;
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    const t = i * 5 + 11;
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      posted: 12 + (t % 41),
      salaryListed: 4 + ((t * 3) % 19),
    };
  });
}

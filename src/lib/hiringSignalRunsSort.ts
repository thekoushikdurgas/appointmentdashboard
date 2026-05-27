/**
 * Client-side sort for scraper.server session rows (Runs tab).
 * Field shapes match OpenSearch `scrape_data_index` / gateway normalization.
 */

import {
  satelliteJobsCollected,
  satelliteJobsCompletionRatio,
  satelliteKeywordsFromRow,
  satelliteRunIdFromRow,
  satelliteStatusFromRow,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";

export type HireSignalRunSortKey =
  | "runId"
  | "keywords"
  | "status"
  | "progress"
  | "started"
  | "finished";

export type HireSignalRunSortDir = "asc" | "desc";

const STATUS_RANK: Record<string, number> = {
  running: 0,
  pending: 1,
  paused: 2,
  done: 3,
  failed: 4,
  cancelled: 5,
};

function pickIso(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

/** True when an ISO datetime has no explicit UTC/offset suffix (scraper.server style). */
function isNaiveIsoDateTime(s: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) &&
    !/[zZ]$/.test(s) &&
    !/[+-]\d{2}:\d{2}$/.test(s) &&
    !/[+-]\d{4}$/.test(s)
  );
}

/** Parse ISO / scraper timestamps for stable ordering (naive values treated as UTC). */
export function hireSignalRunSortMs(iso: string): number {
  let s = (iso ?? "").trim();
  if (!s) return 0;
  if (!s.includes("T")) {
    s = `${s}T00:00:00.000Z`;
  } else if (isNaiveIsoDateTime(s)) {
    s = `${s}Z`;
  }
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}

/** Best “activity” time: worker start, else queue time, else last update. */
export function hireSignalRunStartedMs(row: Record<string, unknown>): number {
  const started = pickIso(row, "started_at", "startedAt", "StartedAt");
  if (started) return hireSignalRunSortMs(started);
  return hireSignalRunSortMs(
    pickIso(row, "created_at", "createdAt", "CreatedAt"),
  );
}

export function hireSignalRunFinishedMs(row: Record<string, unknown>): number {
  return hireSignalRunSortMs(
    pickIso(
      row,
      "finished_at",
      "finishedAt",
      "FinishedAt",
      "completed_at",
      "completedAt",
      "CompletedAt",
      "ended_at",
      "EndedAt",
    ),
  );
}

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function compareNumbers(a: number, b: number): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

export function compareHireSignalRunRows(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  key: HireSignalRunSortKey,
): number {
  switch (key) {
    case "runId":
      return compareStrings(satelliteRunIdFromRow(a), satelliteRunIdFromRow(b));
    case "keywords":
      return compareStrings(
        satelliteKeywordsFromRow(a),
        satelliteKeywordsFromRow(b),
      );
    case "status": {
      const sa = satelliteStatusFromRow(a);
      const sb = satelliteStatusFromRow(b);
      const ra = STATUS_RANK[sa] ?? 99;
      const rb = STATUS_RANK[sb] ?? 99;
      if (ra !== rb) return ra - rb;
      return compareStrings(sa, sb);
    }
    case "progress": {
      const ra = satelliteJobsCompletionRatio(a);
      const rb = satelliteJobsCompletionRatio(b);
      if (ra != null && rb != null && ra !== rb) {
        return compareNumbers(ra, rb);
      }
      return compareNumbers(
        satelliteJobsCollected(a),
        satelliteJobsCollected(b),
      );
    }
    case "started":
      return compareNumbers(
        hireSignalRunStartedMs(a),
        hireSignalRunStartedMs(b),
      );
    case "finished":
      return compareNumbers(
        hireSignalRunFinishedMs(a),
        hireSignalRunFinishedMs(b),
      );
    default:
      return 0;
  }
}

export function sortHireSignalRunRows(
  rows: Record<string, unknown>[],
  key: HireSignalRunSortKey,
  dir: HireSignalRunSortDir,
): Record<string, unknown>[] {
  const copy = [...rows];
  const sign = dir === "asc" ? 1 : -1;
  copy.sort((a, b) => {
    const c = compareHireSignalRunRows(a, b, key);
    if (c !== 0) return c * sign;
    return (
      compareStrings(satelliteRunIdFromRow(a), satelliteRunIdFromRow(b)) * sign
    );
  });
  return copy;
}

/**
 * Normalize `SchedulerJob.statusPayload` JSON from email.server and sync.server
 * into progress fields the UI can render.
 */
export interface ParsedJobStatus {
  progress: number;
  total: number;
  processed: number;
  outputFile?: string;
  error?: string;
  /** Raw satellite status (e.g. email.server ``data.status``) when present. */
  liveStatus?: string;
}

function num(o: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return null;
}

function str(
  o: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

/** email.server GET /jobs/:id/status returns ``{ success, data: { progress_percent, status, ... } }``. */
function unwrapStatusPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const inner = payload.data;
  if (
    inner &&
    typeof inner === "object" &&
    !Array.isArray(inner) &&
    (Object.prototype.hasOwnProperty.call(inner, "progress_percent") ||
      Object.prototype.hasOwnProperty.call(inner, "status") ||
      Object.prototype.hasOwnProperty.call(inner, "processed_rows") ||
      Object.prototype.hasOwnProperty.call(inner, "job_type"))
  ) {
    return inner as Record<string, unknown>;
  }
  return payload;
}

/** Map email.server status strings to dashboard tokens (``RUNNING``, ``COMPLETED``, …). */
export function normalizeEmailSatelliteStatus(
  raw: string | null | undefined,
): string | undefined {
  if (raw == null || typeof raw !== "string") return undefined;
  const s = raw.trim().toLowerCase();
  if (!s) return undefined;
  const m: Record<string, string> = {
    processing: "RUNNING",
    running: "RUNNING",
    pending: "PENDING",
    queued: "PENDING",
    in_queue: "PENDING",
    open: "OPEN",
    paused: "PAUSED",
    completed: "COMPLETED",
    complete: "COMPLETED",
    done: "COMPLETED",
    success: "COMPLETED",
    failed: "FAILED",
    error: "FAILED",
    cancelled: "CANCELLED",
    canceled: "CANCELLED",
  };
  return m[s] ?? raw.trim().toUpperCase();
}

export function parseStatusPayload(statusPayload: unknown): ParsedJobStatus {
  const base: ParsedJobStatus = {
    progress: 0,
    total: 0,
    processed: 0,
  };
  if (statusPayload == null || typeof statusPayload !== "object") {
    return base;
  }
  const p = unwrapStatusPayload(statusPayload as Record<string, unknown>);

  const jobResponse =
    typeof p.job_response === "object" &&
    p.job_response !== null &&
    !Array.isArray(p.job_response)
      ? (p.job_response as Record<string, unknown>)
      : null;

  const progressPercent = num(
    p,
    "progress_percent",
    "progressPercent",
    "progress_pct",
    "percent",
  );
  const processedRows =
    num(
      p,
      "processed_rows",
      "processedRows",
      "processed",
      "rows_processed",
    ) ??
    (jobResponse
      ? num(
          jobResponse,
          "processed_rows",
          "processedRows",
          "processed",
          "rows_processed",
        )
      : null);
  const totalRows = num(p, "total_rows", "totalRows", "total", "row_count");

  const liveStatus = str(p, "status", "job_status", "state");

  const outputFile =
    str(
      p,
      "output_csv_key",
      "outputCsvKey",
      "output_file",
      "outputFile",
      "download_url",
      "downloadUrl",
      "s3_url",
    ) ??
    (typeof p.result === "object" && p.result !== null
      ? str(
          p.result as Record<string, unknown>,
          "output_csv_key",
          "download_url",
        )
      : undefined);

  const error =
    str(p, "error", "message", "detail") ??
    (typeof p.error === "object" && p.error !== null
      ? str(p.error as Record<string, unknown>, "message")
      : undefined);

  let progress = 0;
  if (progressPercent != null && progressPercent >= 0) {
    progress = Math.min(100, Math.round(progressPercent));
  } else if (processedRows != null && totalRows != null && totalRows > 0) {
    progress = Math.min(100, Math.round((processedRows / totalRows) * 100));
  }

  return {
    progress,
    total: totalRows ?? 0,
    processed: processedRows ?? 0,
    outputFile,
    error,
    ...(liveStatus ? { liveStatus } : {}),
  };
}

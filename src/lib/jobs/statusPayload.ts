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

export function parseStatusPayload(statusPayload: unknown): ParsedJobStatus {
  const base: ParsedJobStatus = {
    progress: 0,
    total: 0,
    processed: 0,
  };
  if (statusPayload == null || typeof statusPayload !== "object") {
    return base;
  }
  const p = statusPayload as Record<string, unknown>;

  const progressPercent = num(
    p,
    "progress_percent",
    "progressPercent",
    "progress_pct",
    "percent",
  );
  const processedRows = num(
    p,
    "processed_rows",
    "processedRows",
    "processed",
    "rows_processed",
  );
  const totalRows = num(p, "total_rows", "totalRows", "total", "row_count");

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
  };
}

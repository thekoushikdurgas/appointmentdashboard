import type { S3FileData, S3FileStats } from "@/graphql/generated/types";

/** Unwrap `rows[].data` JSON into plain objects for table rendering. */
export function rowsFromS3FileData(
  data: S3FileData,
): Record<string, unknown>[] {
  return data.rows.map((row) => {
    const d = row.data;
    if (d && typeof d === "object" && !Array.isArray(d)) {
      return d as Record<string, unknown>;
    }
    return { value: d };
  });
}

/** Column keys from first row, stable order. */
export function columnKeysFromRows(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]);
}

/** Normalize `S3FileStats.columns` JSON for display (array of { name, type? } or similar). */
export function parseStatsColumnsJson(
  columns: unknown,
): Array<{ name: string; type?: string }> {
  if (!columns) return [];
  if (Array.isArray(columns)) {
    return columns.map((c) => {
      if (c && typeof c === "object" && "name" in c) {
        const o = c as Record<string, unknown>;
        return {
          name: String(o.name ?? ""),
          type: o.type != null ? String(o.type) : undefined,
        };
      }
      return { name: String(c) };
    });
  }
  if (typeof columns === "object") {
    return Object.entries(columns as Record<string, unknown>).map(
      ([name, v]) => ({
        name,
        type:
          v != null && typeof v === "object" && "type" in (v as object)
            ? String((v as { type?: unknown }).type)
            : typeof v === "string"
              ? v
              : undefined,
      }),
    );
  }
  return [];
}

export function statsColumnsSummary(stats: S3FileStats): string {
  const parsed = parseStatsColumnsJson(stats.columns);
  if (parsed.length === 0) return "—";
  return parsed
    .map((c) => c.name)
    .filter(Boolean)
    .join(", ");
}

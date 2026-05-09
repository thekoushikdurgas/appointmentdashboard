"use client";

import { cn } from "@/lib/utils";

export type HeatmapColumn<T> = {
  id: keyof T | string;
  header: string;
  /** When true, render numeric column as relative bar in cell. */
  heatmap?: boolean;
  align?: "left" | "right";
  /** Format raw cell value for display. */
  format?: (row: T) => string;
};

export interface HeatmapTableProps<T extends Record<string, unknown>> {
  rows: T[];
  columns: HeatmapColumn<T>[];
  /** Numeric field used for heat scale when heatmap column is present. */
  valueKey?: keyof T;
  className?: string;
  emptyLabel?: string;
}

function cellVal<T>(row: T, id: string): unknown {
  return (row as Record<string, unknown>)[id];
}

export function HeatmapTable<T extends Record<string, unknown>>({
  rows,
  columns,
  valueKey = "value" as keyof T,
  className,
  emptyLabel = "No rows.",
}: HeatmapTableProps<T>) {
  const numericCol = columns.find((c) => c.heatmap);
  let max = 1;
  if (numericCol && valueKey) {
    for (const r of rows) {
      const v = Number(cellVal(r, String(valueKey)));
      if (Number.isFinite(v) && v > max) max = v;
    }
  }

  if (!rows.length) {
    return (
      <p className="c360-text-sm c360-text-muted c360-py-6">{emptyLabel}</p>
    );
  }

  return (
    <div className={cn("c360-overflow-x-auto", className)}>
      <table className="c360-table c360-table--compact c360-w-full">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={String(c.id)}
                className={cn(c.align === "right" && "c360-text-right")}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {columns.map((col) => {
                const raw = cellVal(row, String(col.id));
                const text = col.format
                  ? col.format(row)
                  : raw == null
                    ? "—"
                    : String(raw);
                const heat =
                  col.heatmap &&
                  numericCol &&
                  valueKey &&
                  Number.isFinite(Number(cellVal(row, String(valueKey))));
                const v = heat ? Number(cellVal(row, String(valueKey))) : 0;
                const pct = heat ? Math.round((v / max) * 100) : 0;

                return (
                  <td
                    key={String(col.id)}
                    className={cn(
                      col.align === "right" && "c360-text-right",
                      heat && "c360-relative",
                    )}
                  >
                    {heat ? (
                      <span className="c360-relative c360-z-10">{text}</span>
                    ) : (
                      text
                    )}
                    {heat ? (
                      <span
                        className="c360-absolute c360-inset-y-0 c360-left-0 c360-bg-success/15"
                        style={{ width: `${pct}%` }}
                        aria-hidden
                      />
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

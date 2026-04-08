"use client";

import { ReactNode, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyVars } from "@/lib/applyCssVars";

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
  stickyHeader?: boolean;
  selectedKeys?: Set<string>;
  onSelectAll?: (selected: boolean) => void;
  onSelectRow?: (key: string, selected: boolean) => void;
}

type SortDir = "asc" | "desc" | null;

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading,
  emptyState,
  className,
  stickyHeader,
  selectedKeys,
  onSelectAll,
  onSelectRow,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const toggleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  const hasSelection = !!selectedKeys;
  const allSelected =
    hasSelection &&
    data.length > 0 &&
    data.every((row, i) => selectedKeys.has(keyExtractor(row, i)));
  const someSelected =
    hasSelection &&
    data.some((row, i) => selectedKeys.has(keyExtractor(row, i)));

  return (
    <div className={cn("c360-table-wrapper", className)}>
      <table
        className={cn(
          "c360-table",
          stickyHeader && "c360-table--sticky-header",
        )}
      >
        <thead>
          <tr>
            {hasSelection && (
              <th className="c360-table__th--select">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="c360-cursor-pointer"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  col.sortable && "c360-table-th--sortable",
                  col.align === "center" && "c360-text-center",
                  col.align === "right" && "c360-text-right",
                  col.width !== undefined && "c360-table-th--col-width",
                )}
                ref={(el) =>
                  applyVars(el, {
                    "--c360-col-width":
                      col.width === undefined
                        ? null
                        : typeof col.width === "number"
                          ? `${col.width}px`
                          : col.width,
                  })
                }
                onClick={col.sortable ? () => toggleSort(col.key) : undefined}
              >
                <div
                  className={cn(
                    "c360-flex c360-items-center c360-gap-1",
                    col.align === "right" && "c360-justify-end",
                    col.align === "center" && "c360-justify-center",
                  )}
                >
                  {col.header}
                  {col.sortable && (
                    <span className="c360-text-muted c360-flex">
                      {sortKey === col.key && sortDir === "asc" ? (
                        <ChevronUp size={14} />
                      ) : sortKey === col.key && sortDir === "desc" ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronsUpDown size={14} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {hasSelection && <td />}
                {columns.map((col) => (
                  <td key={col.key}>
                    <div className="c360-skeleton c360-table__skeleton-bar" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (hasSelection ? 1 : 0)}
                className="c360-table__empty"
              >
                {emptyState ?? "No data"}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const key = keyExtractor(row, index);
              const selected = selectedKeys?.has(key) ?? false;
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    onRowClick && "c360-cursor-pointer",
                    selected && "tr--selected",
                  )}
                >
                  {hasSelection && (
                    <td
                      className="c360-table__td--select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => onSelectRow?.(key, e.target.checked)}
                        className="c360-cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        col.align === "center" && "c360-text-center",
                        col.align === "right" && "c360-text-right",
                      )}
                    >
                      {col.render(row, index)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

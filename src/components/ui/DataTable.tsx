"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyVars } from "@/lib/applyCssVars";

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: number | string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string);
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

type SortDir = "asc" | "desc" | null;

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  searchable = true,
  searchPlaceholder = "Search...",
  pageSize = 10,
  emptyMessage = "No data",
  loading = false,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      const n = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === "asc" ? n : -n;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getRowKey = (row: T) =>
    typeof rowKey === "function" ? rowKey(row) : String(row[rowKey]);

  return (
    <div className={cn(className)}>
      {searchable && (
        <div className="c360-search c360-mb-3">
          <Search size={14} className="c360-search__icon" aria-hidden />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="c360-input c360-search__input c360-w-full"
          />
        </div>
      )}

      <div className="c360-table-wrapper">
        <table className="c360-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const key = String(col.key);
                const isSorted = sortKey === key;
                return (
                  <th
                    key={key}
                    className={cn(
                      col.sortable && "c360-table-th--sortable",
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
                    onClick={() => col.sortable && handleSort(key)}
                  >
                    <div className="c360-flex c360-items-center c360-gap-1">
                      {col.header}
                      {col.sortable && (
                        <span className="c360-text-muted c360-opacity-70 c360-flex">
                          {isSorted && sortDir === "asc" ? (
                            <ChevronUp size={12} />
                          ) : isSorted && sortDir === "desc" ? (
                            <ChevronDown size={12} />
                          ) : (
                            <ChevronsUpDown size={12} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="c360-table__loading">
                  <span className="c360-spinner" />
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="c360-table__empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr key={getRowKey(row)}>
                  {columns.map((col) => {
                    const key = String(col.key);
                    return (
                      <td key={key}>
                        {col.render
                          ? col.render(row)
                          : String(row[col.key as keyof T] ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="c360-datatable-footer">
          <span>
            {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="c360-datatable-footer__actions">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="c360-btn c360-btn--ghost c360-btn--sm"
            >
              ‹ Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={cn(
                    "c360-btn c360-btn--sm",
                    p === page ? "c360-btn--primary" : "c360-btn--ghost",
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="c360-btn c360-btn--ghost c360-btn--sm"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

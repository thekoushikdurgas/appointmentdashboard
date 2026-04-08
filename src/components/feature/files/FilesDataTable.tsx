"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { MoreHorizontal, FolderOpen, Upload } from "lucide-react";
import { cn, formatFileSize, normalizeS3FileSizeBytes } from "@/lib/utils";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import type { S3FileInfo } from "@/graphql/generated/types";
import {
  isAllowedTabularFilename,
  tabularContentTypeFromFilename,
} from "@/lib/tabularUpload";

export interface FilesDataTableProps {
  files: S3FileInfo[];
  loading?: boolean;
  /** True on the very first load when no cache is available — renders skeleton rows. */
  isSkeletonLoading?: boolean;
  emptyHint: string;
  downloadingKey?: string | null;
  /** Called when the empty-state "Upload files" CTA is clicked. */
  onUpload?: () => void;
  onOpenDetail: (f: S3FileInfo) => void;
  /** Opens schema modal (GraphQL → storage GET /api/v1/analysis/schema). */
  onOpenSchema: (f: S3FileInfo) => void;
  /** Opens stats modal (GraphQL → storage GET /api/v1/analysis/stats). */
  onOpenStats: (f: S3FileInfo) => void;
  /** Opens tabular preview modal (GraphQL `s3FileData`, first page). */
  onOpenPreview: (f: S3FileInfo) => void;
  /** Opens scheduler jobs modal (GraphQL `jobs.jobs(relatedFileKey: …)`). */
  onOpenJobs: (f: S3FileInfo) => void;
  /** Opens start-job modal (email finder/verify or Connectra import) for this object. */
  onStartJob?: (f: S3FileInfo) => void;
  onDownload: (f: S3FileInfo) => void;
  onDeleteRequest: (f: S3FileInfo) => void;
  /** When provided, toolbar shows delete for current selection. */
  onBulkDelete?: (keys: string[]) => void | Promise<void>;
}

type SortKey = "fileId" | "uploaded" | "name" | "folder" | "kind" | "size";
type SortDir = "asc" | "desc";

function hashFileId(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++)
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  const n = (Math.abs(h) % 90000) + 10000;
  return `#F-${n}`;
}

function formatCheckInDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

function folderLabel(key: string): string {
  const k = key.replace(/\\/g, "/");
  const i = k.indexOf("/");
  if (i <= 0) return "root";
  return k.slice(0, i);
}

function kindLabel(filename: string): string {
  const n = filename.toLowerCase();
  if (n.endsWith(".csv")) return "CSV";
  if (n.endsWith(".tsv")) return "TSV";
  if (n.endsWith(".xlsx")) return "Excel workbook";
  if (n.endsWith(".xls")) return "Excel (legacy)";
  return "File";
}

function listRowContentType(f: S3FileInfo): string | null {
  if (f.contentType) return f.contentType;
  if (isAllowedTabularFilename(f.filename))
    return tabularContentTypeFromFilename(f.filename);
  return null;
}

function sortFiles(
  rows: S3FileInfo[],
  sortKey: SortKey,
  sortDir: SortDir,
): S3FileInfo[] {
  const mul = sortDir === "asc" ? 1 : -1;
  const out = [...rows];
  out.sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "fileId":
        cmp = hashFileId(a.key).localeCompare(hashFileId(b.key));
        break;
      case "uploaded": {
        const ta = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const tb = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        cmp = ta - tb;
        break;
      }
      case "name":
        cmp = a.filename.localeCompare(b.filename, undefined, {
          sensitivity: "base",
        });
        break;
      case "folder":
        cmp = folderLabel(a.key).localeCompare(folderLabel(b.key));
        break;
      case "kind":
        cmp = kindLabel(a.filename).localeCompare(kindLabel(b.filename));
        break;
      case "size": {
        const sa = normalizeS3FileSizeBytes(a.size);
        const sb = normalizeS3FileSizeBytes(b.size);
        cmp = sa - sb;
        break;
      }
      default:
        cmp = 0;
    }
    return cmp * mul;
  });
  return out;
}

function SortCaret({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className="c360-files-dt__sort-carets" aria-hidden>
      <span
        className={cn(
          "c360-files-dt__sort-caret",
          active && dir === "asc" && "c360-files-dt__sort-caret--on",
        )}
      >
        ▲
      </span>
      <span
        className={cn(
          "c360-files-dt__sort-caret",
          active && dir === "desc" && "c360-files-dt__sort-caret--on",
        )}
      >
        ▼
      </span>
    </span>
  );
}

/** Renders 5 skeleton placeholder rows during the initial (no-cache) load. */
function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="c360-files-dt__skeleton-row" aria-hidden="true">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <span className="c360-files-dt__skeleton-cell" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function FilesDataTable({
  files,
  loading,
  isSkeletonLoading,
  emptyHint,
  downloadingKey,
  onUpload,
  onOpenDetail,
  onOpenSchema,
  onOpenStats,
  onOpenPreview,
  onOpenJobs,
  onStartJob,
  onDownload,
  onDeleteRequest,
  onBulkDelete,
}: FilesDataTableProps) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("uploaded");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter(
      (f) =>
        f.filename.toLowerCase().includes(q) || f.key.toLowerCase().includes(q),
    );
  }, [files, search]);

  const sorted = useMemo(
    () => sortFiles(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
  );

  const totalFiltered = sorted.length;
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize) || 1);

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const safePage = Math.min(page, pageCount - 1);
  const pageStart = safePage * pageSize;
  const pageRows = sorted.slice(pageStart, pageStart + pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  const ariaSort = (key: SortKey): "ascending" | "descending" | "none" => {
    if (sortKey !== key) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  };

  const allOnPageSelected =
    pageRows.length > 0 && pageRows.every((f) => selected.has(f.key));
  const someOnPageSelected = pageRows.some((f) => selected.has(f.key));

  const toggleSelectAllPage = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const f of pageRows) {
          if (checked) next.add(f.key);
          else next.delete(f.key);
        }
        return next;
      });
    },
    [pageRows],
  );

  const toggleRow = useCallback((key: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const selectedList = useMemo(
    () => files.filter((f) => selected.has(f.key)),
    [files, selected],
  );

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedList.length === 0) return;
    await onBulkDelete(selectedList.map((f) => f.key));
    setSelected(new Set());
  };

  const showingFrom = totalFiltered === 0 ? 0 : pageStart + 1;
  const showingTo = Math.min(pageStart + pageSize, totalFiltered);

  return (
    <div className="c360-files-dt">
      <div className="c360-files-dt__toolbar">
        <div className="c360-files-dt__toolbar-left">
          <span className="c360-text-muted c360-text-sm">Show</span>
          <select
            className="c360-files-dt__page-size"
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            aria-label="Rows per page"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span className="c360-text-muted c360-text-sm">entries</span>
          {onBulkDelete && selected.size > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="c360-ml-3"
              onClick={() => void handleBulkDelete()}
            >
              Delete selected ({selected.size})
            </Button>
          )}
        </div>
        <div className="c360-files-dt__toolbar-right">
          <label
            htmlFor="c360-files-dt-search"
            className="c360-text-muted c360-text-sm c360-mr-2"
          >
            Search:
          </label>
          <input
            id="c360-files-dt-search"
            type="search"
            className="c360-input c360-input--sm c360-files-dt__search"
            placeholder="Filter by name or key…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      <div className="c360-files-dt__table-wrap">
        <table className="c360-table c360-files-dt__table">
          <thead>
            <tr>
              <th className="c360-files-dt__th--checkbox">
                <Checkbox
                  size="sm"
                  checked={allOnPageSelected}
                  indeterminate={someOnPageSelected && !allOnPageSelected}
                  onChange={toggleSelectAllPage}
                  aria-label="Select all on this page"
                />
              </th>
              <th aria-sort={ariaSort("fileId")}>
                <button
                  type="button"
                  className="c360-files-dt__th-btn"
                  onClick={() => toggleSort("fileId")}
                >
                  File ID
                  <SortCaret active={sortKey === "fileId"} dir={sortDir} />
                </button>
              </th>
              <th aria-sort={ariaSort("uploaded")}>
                <button
                  type="button"
                  className="c360-files-dt__th-btn"
                  onClick={() => toggleSort("uploaded")}
                >
                  Uploaded
                  <SortCaret active={sortKey === "uploaded"} dir={sortDir} />
                </button>
              </th>
              <th aria-sort={ariaSort("name")}>
                <button
                  type="button"
                  className="c360-files-dt__th-btn"
                  onClick={() => toggleSort("name")}
                >
                  Name
                  <SortCaret active={sortKey === "name"} dir={sortDir} />
                </button>
              </th>
              <th aria-sort={ariaSort("folder")}>
                <button
                  type="button"
                  className="c360-files-dt__th-btn"
                  onClick={() => toggleSort("folder")}
                >
                  Folder
                  <SortCaret active={sortKey === "folder"} dir={sortDir} />
                </button>
              </th>
              <th aria-sort={ariaSort("kind")}>
                <button
                  type="button"
                  className="c360-files-dt__th-btn"
                  onClick={() => toggleSort("kind")}
                >
                  Type
                  <SortCaret active={sortKey === "kind"} dir={sortDir} />
                </button>
              </th>
              <th>Status</th>
              <th aria-sort={ariaSort("size")}>
                <button
                  type="button"
                  className="c360-files-dt__th-btn"
                  onClick={() => toggleSort("size")}
                >
                  Size
                  <SortCaret active={sortKey === "size"} dir={sortDir} />
                </button>
              </th>
              <th className="c360-text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isSkeletonLoading ? (
              <SkeletonRows cols={9} />
            ) : loading && files.length === 0 ? (
              <tr>
                <td colSpan={9} className="c360-table__loading">
                  <span className="c360-spinner" />
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="c360-files-dt__empty">
                    <FolderOpen
                      className="c360-files-dt__empty-icon"
                      size={40}
                      aria-hidden="true"
                    />
                    <p className="c360-files-dt__empty-heading">
                      {files.length === 0 ? "No files yet" : "No files match"}
                    </p>
                    <p className="c360-files-dt__empty-hint">{emptyHint}</p>
                    {files.length === 0 && onUpload && (
                      <Button
                        className="c360-files-dt__empty-cta"
                        leftIcon={<Upload size={16} />}
                        onClick={onUpload}
                      >
                        Upload files
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((f) => (
                <tr key={f.key} className="c360-files-dt__row">
                  <td
                    className="c360-files-dt__td--checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      size="sm"
                      checked={selected.has(f.key)}
                      onChange={(c) => toggleRow(f.key, c)}
                      aria-label={`Select ${f.filename}`}
                    />
                  </td>
                  <td>
                    <strong className="c360-files-dt__file-id">
                      {hashFileId(f.key)}
                    </strong>
                  </td>
                  <td className="c360-text-muted c360-text-sm">
                    {formatCheckInDate(f.lastModified)}
                  </td>
                  <td>
                    <span className="c360-files-page__filename">
                      {f.filename}
                    </span>
                  </td>
                  <td className="c360-text-muted c360-text-sm">
                    {folderLabel(f.key)}
                  </td>
                  <td className="c360-text-muted c360-text-sm">
                    {kindLabel(f.filename)}
                  </td>
                  <td>
                    <span className="c360-files-dt-badge c360-files-dt-badge--success">
                      <span className="c360-files-dt-badge__dot" aria-hidden />
                      Available
                    </span>
                  </td>
                  <td className="c360-text-muted c360-text-sm">
                    {formatFileSize(normalizeS3FileSizeBytes(f.size))}
                    {listRowContentType(f) && (
                      <span className="c360-files-dt__size-meta">
                        {" "}
                        · {listRowContentType(f)}
                      </span>
                    )}
                  </td>
                  <td className="c360-text-right">
                    <Popover
                      align="end"
                      width={280}
                      trigger={
                        <button
                          type="button"
                          className="c360-files-dt__action-btn"
                          aria-label={`Actions for ${f.filename}`}
                        >
                          <MoreHorizontal size={20} />
                        </button>
                      }
                      content={
                        <div className="c360-files-dt__menu">
                          <button
                            type="button"
                            className="c360-files-dt__menu-item"
                            onClick={() => onOpenDetail(f)}
                            aria-label={`View details for ${f.filename}`}
                          >
                            View details
                          </button>
                          <button
                            type="button"
                            className="c360-files-dt__menu-item"
                            onClick={() => onOpenPreview(f)}
                            aria-label={`Preview ${f.filename}`}
                          >
                            Preview content
                          </button>
                          <button
                            type="button"
                            className="c360-files-dt__menu-item"
                            onClick={() => onOpenJobs(f)}
                            aria-label={`Related jobs for ${f.filename}`}
                          >
                            Related jobs
                          </button>
                          {onStartJob ? (
                            <button
                              type="button"
                              className="c360-files-dt__menu-item"
                              onClick={() => onStartJob(f)}
                              aria-label={`Start job from ${f.filename}`}
                            >
                              Start job from file
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="c360-files-dt__menu-item"
                            onClick={() => onOpenSchema(f)}
                            aria-label={`View schema for ${f.filename}`}
                          >
                            View schema
                          </button>
                          <button
                            type="button"
                            className="c360-files-dt__menu-item"
                            onClick={() => onOpenStats(f)}
                            aria-label={`View stats for ${f.filename}`}
                          >
                            View stats
                          </button>
                          <button
                            type="button"
                            className="c360-files-dt__menu-item"
                            disabled={downloadingKey === f.key}
                            onClick={() => onDownload(f)}
                            aria-label={`Download ${f.filename}`}
                          >
                            {downloadingKey === f.key
                              ? "Downloading…"
                              : "Download"}
                          </button>
                          <button
                            type="button"
                            className="c360-files-dt__menu-item c360-files-dt__menu-item--danger"
                            onClick={() => onDeleteRequest(f)}
                            aria-label={`Delete ${f.filename}`}
                          >
                            Delete
                          </button>
                        </div>
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="c360-files-dt__footer">
        <p className="c360-text-muted c360-text-sm">
          Showing {showingFrom} to {showingTo} of {totalFiltered} entries
          {files.length !== totalFiltered && (
            <span> (filtered from {files.length} total)</span>
          )}
        </p>
        <div className="c360-files-dt__pager">
          <Button
            variant="ghost"
            size="sm"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="c360-text-muted c360-text-sm">
            Page {safePage + 1} of {pageCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

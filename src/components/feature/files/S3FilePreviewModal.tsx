"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { s3Service } from "@/services/graphql/s3Service";
import { rowsFromS3FileData, columnKeysFromRows } from "@/lib/s3FileData";

const PREVIEW_LIMIT = 25;

export interface S3FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileKey: string | null;
  fileName?: string | null;
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/**
 * Paginated tabular preview only (same source as file detail “Data preview” tab):
 * GraphQL `s3FileData` → API → storage preview for the logical `fileKey`.
 */
export function S3FilePreviewModal({
  isOpen,
  onClose,
  fileKey,
  fileName,
}: S3FilePreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableKeys, setTableKeys] = useState<string[]>([]);
  const [tableRows, setTableRows] = useState<Record<string, unknown>[]>([]);
  const [dataMeta, setDataMeta] = useState<{
    totalRows?: number | null;
    offset: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !fileKey) return;
    setError(null);
    setTableKeys([]);
    setTableRows([]);
    setDataMeta(null);
    setLoading(true);

    const run = async () => {
      try {
        const dataRes = await s3Service.getFileData(fileKey, PREVIEW_LIMIT, 0);
        const raw = dataRes.s3.s3FileData;
        const rows = rowsFromS3FileData(raw);
        setTableKeys(columnKeysFromRows(rows));
        setTableRows(rows);
        setDataMeta({
          totalRows: raw.totalRows,
          offset: raw.offset,
          limit: raw.limit,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [isOpen, fileKey]);

  const titleName = fileName?.trim() || fileKey || "File";

  return (
    <Modal
      isOpen={isOpen && !!fileKey}
      onClose={onClose}
      title={`Data preview — ${titleName}`}
      size="lg"
    >
      {fileKey && (
        <p className="c360-text-muted c360-text-sm c360-mb-3">
          <span className="c360-text-muted">Key: </span>
          <code className="c360-file-detail__key c360-text-xs">{fileKey}</code>
        </p>
      )}
      <p className="c360-text-muted c360-text-xs c360-mb-3">
        First {PREVIEW_LIMIT} rows via GraphQL{" "}
        <code className="c360-text-xs">s3FileData</code> (same preview pipeline
        as <strong>View details</strong> → Data).
      </p>

      {loading && (
        <div className="c360-table__loading c360-file-detail__loading">
          <span className="c360-spinner" />
        </div>
      )}

      {!loading && error && (
        <p className="c360-text-danger c360-text-sm">{error}</p>
      )}

      {!loading && !error && dataMeta && (
        <p className="c360-text-muted c360-text-sm c360-mb-2">
          Showing {tableRows.length} row
          {tableRows.length !== 1 ? "s" : ""}
          {dataMeta.totalRows != null
            ? ` of ${dataMeta.totalRows} total`
            : ""}{" "}
          (limit {dataMeta.limit}, offset {dataMeta.offset})
        </p>
      )}

      {!loading && !error && tableKeys.length === 0 && (
        <p className="c360-text-muted">No preview rows returned.</p>
      )}

      {!loading && !error && tableKeys.length > 0 && (
        <div className="c360-table-wrapper c360-file-detail__preview-scroll">
          <table className="c360-table">
            <thead>
              <tr>
                {tableKeys.map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i}>
                  {tableKeys.map((k) => (
                    <td
                      key={k}
                      className="c360-text-muted c360-file-detail__cell"
                    >
                      {formatCell(row[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

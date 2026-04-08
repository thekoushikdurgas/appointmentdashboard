"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import {
  formatDate,
  formatFileSize,
  normalizeS3FileSizeBytes,
} from "@/lib/utils";
import {
  rowsFromS3FileData,
  columnKeysFromRows,
  parseStatsColumnsJson,
} from "@/lib/s3FileData";
import { s3Service } from "@/services/graphql/s3Service";
import type {
  FileSchemaColumn,
  S3FileStats,
  S3FileInfo,
} from "@/graphql/generated/types";

export interface S3FileDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileKey: string | null;
  /** Optional row from list; fetches full info when opening. */
  summary?: Pick<
    S3FileInfo,
    "filename" | "size" | "lastModified" | "contentType"
  > | null;
}

export function S3FileDetailModal({
  isOpen,
  onClose,
  fileKey,
  summary,
}: S3FileDetailModalProps) {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<S3FileInfo | null>(null);
  const [schema, setSchema] = useState<FileSchemaColumn[]>([]);
  const [stats, setStats] = useState<S3FileStats | null>(null);
  const [tableKeys, setTableKeys] = useState<string[]>([]);
  const [tableRows, setTableRows] = useState<Record<string, unknown>[]>([]);
  const [dataMeta, setDataMeta] = useState<{
    totalRows?: number | null;
    offset: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !fileKey) return;
    setTab("overview");
    setError(null);
    setLoading(true);
    setInfo(null);
    setSchema([]);
    setStats(null);
    setTableKeys([]);
    setTableRows([]);
    setDataMeta(null);

    const run = async () => {
      try {
        const [infoRes, schemaRes, statsRes, dataRes] = await Promise.all([
          s3Service.getFileInfo(fileKey),
          s3Service.getFileSchema(fileKey),
          s3Service.getFileStats(fileKey),
          s3Service.getFileData(fileKey, 25, 0),
        ]);
        setInfo(infoRes.s3.s3FileInfo);
        setSchema(schemaRes.s3.s3FileSchema);
        setStats(statsRes.s3.s3FileStats);
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

  const displayName = info?.filename ?? summary?.filename ?? fileKey ?? "File";
  const displaySize = info?.size ?? summary?.size;
  const displayModified = info?.lastModified ?? summary?.lastModified;
  const displayType = info?.contentType ?? summary?.contentType;

  return (
    <Modal
      isOpen={isOpen && !!fileKey}
      onClose={onClose}
      title={displayName}
      size="lg"
    >
      {loading && (
        <div className="c360-table__loading c360-file-detail__loading">
          <span className="c360-spinner" />
        </div>
      )}

      {!loading && error && <p className="c360-text-danger">{error}</p>}

      {!loading && !error && (
        <Tabs value={tab} onValueChange={setTab} variant="underline">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data preview</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="c360-stack c360-tab-panel">
            <div className="c360-text-muted c360-text-sm">Key</div>
            <code className="c360-file-detail__key">{fileKey}</code>
            {displaySize != null && (
              <p>
                <span className="c360-text-muted">Size: </span>
                {formatFileSize(normalizeS3FileSizeBytes(displaySize))}
              </p>
            )}
            {displayModified && (
              <p>
                <span className="c360-text-muted">Modified: </span>
                {formatDate(displayModified)}
              </p>
            )}
            {displayType && (
              <p>
                <span className="c360-text-muted">Type: </span>
                {displayType}
              </p>
            )}
          </TabsContent>

          <TabsContent value="data" className="c360-tab-panel">
            {dataMeta && (
              <p className="c360-text-muted c360-text-sm c360-mb-2">
                Showing {tableRows.length} row
                {tableRows.length !== 1 ? "s" : ""}
                {dataMeta.totalRows != null
                  ? ` of ${dataMeta.totalRows} total`
                  : ""}{" "}
                (limit {dataMeta.limit}, offset {dataMeta.offset})
              </p>
            )}
            {tableKeys.length === 0 ? (
              <Alert variant="info" className="c360-mt-2">
                No preview data is available for this file. The storage service
                returned an empty response — the file may be in an unsupported
                format, still processing, or the EC2 worker has not yet indexed
                it.
              </Alert>
            ) : (
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
          </TabsContent>

          <TabsContent value="schema" className="c360-tab-panel">
            {schema.length === 0 ? (
              <Alert variant="info" className="c360-mt-2">
                No schema information is available for this file. The EC2
                metadata worker may not have processed it yet, or it may be in a
                format that does not support column extraction (e.g. binary or
                non-tabular files).
              </Alert>
            ) : (
              <div className="c360-table-wrapper">
                <table className="c360-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Nullable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schema.map((col) => (
                      <tr key={col.name}>
                        <td className="c360-font-medium">{col.name}</td>
                        <td>
                          <Badge color="blue">{col.type}</Badge>
                        </td>
                        <td>{col.nullable ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="c360-tab-panel">
            {!stats ? (
              <Alert variant="info" className="c360-mt-2">
                Statistics are not yet available for this file. The EC2 metadata
                worker generates row counts and column statistics after upload —
                this may take a few moments to appear.
              </Alert>
            ) : (
              <>
                <p>
                  <span className="c360-text-muted">Row count: </span>
                  <strong>{stats.rowCount}</strong>
                </p>
                <p className="c360-text-muted c360-text-sm c360-mb-2">
                  Columns (from stats payload)
                </p>
                <ul className="c360-file-detail__stats-list">
                  {parseStatsColumnsJson(stats.columns).map((c) => (
                    <li key={c.name}>
                      <strong>{c.name}</strong>
                      {c.type ? ` — ${c.type}` : ""}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </Modal>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

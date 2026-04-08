"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { s3Service } from "@/services/graphql/s3Service";
import { parseStatsColumnsJson } from "@/lib/s3FileData";
import type { S3FileStats } from "@/graphql/generated/types";

export interface S3FileStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileKey: string | null;
  fileName?: string | null;
}

/**
 * Loads analysis stats only (same source as file detail “Stats” tab):
 * GraphQL `s3FileStats` → API → s3storage `GET /api/v1/analysis/stats?key={bucket_id}/{file_key}`.
 */
export function S3FileStatsModal({
  isOpen,
  onClose,
  fileKey,
  fileName,
}: S3FileStatsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<S3FileStats | null>(null);

  useEffect(() => {
    if (!isOpen || !fileKey) return;
    setError(null);
    setStats(null);
    setLoading(true);

    const run = async () => {
      try {
        const res = await s3Service.getFileStats(fileKey);
        setStats(res.s3.s3FileStats);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [isOpen, fileKey]);

  const titleName = fileName?.trim() || fileKey || "File";
  const columnSummaries = stats ? parseStatsColumnsJson(stats.columns) : [];

  return (
    <Modal
      isOpen={isOpen && !!fileKey}
      onClose={onClose}
      title={`File statistics — ${titleName}`}
      size="lg"
    >
      {fileKey && (
        <p className="c360-text-muted c360-text-sm c360-mb-3">
          <span className="c360-text-muted">Key: </span>
          <code className="c360-file-detail__key c360-text-xs">{fileKey}</code>
        </p>
      )}
      <p className="c360-text-muted c360-text-xs c360-mb-3">
        Stats come from the storage analysis service (same endpoint as{" "}
        <code className="c360-text-xs">/api/v1/analysis/stats</code> behind
        GraphQL).
      </p>

      {loading && (
        <div className="c360-table__loading c360-file-detail__loading">
          <span className="c360-spinner" />
        </div>
      )}

      {!loading && error && (
        <p className="c360-text-danger c360-text-sm">{error}</p>
      )}

      {!loading && !error && stats && (
        <>
          <p className="c360-mb-3">
            <span className="c360-text-muted">Row count: </span>
            <strong>{stats.rowCount ?? "—"}</strong>
          </p>
          {columnSummaries.length === 0 ? (
            <p className="c360-text-muted">
              No per-column statistics in the payload (empty file, unsupported
              format, or analysis not run yet).
            </p>
          ) : (
            <>
              <p className="c360-text-muted c360-text-sm c360-mb-2">
                Columns (from stats payload)
              </p>
              <ul className="c360-file-detail__stats-list">
                {columnSummaries.map((c) => (
                  <li key={c.name}>
                    <strong>{c.name}</strong>
                    {c.type ? ` — ${c.type}` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

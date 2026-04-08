"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { s3Service } from "@/services/graphql/s3Service";
import type { FileSchemaColumn } from "@/graphql/generated/types";

export interface S3FileSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileKey: string | null;
  fileName?: string | null;
}

/**
 * Loads column schema only (same source as file detail “Schema” tab):
 * GraphQL `s3FileSchema` → API → s3storage `GET /api/v1/analysis/schema?key={bucket_id}/{file_key}`.
 */
export function S3FileSchemaModal({
  isOpen,
  onClose,
  fileKey,
  fileName,
}: S3FileSchemaModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<FileSchemaColumn[]>([]);

  useEffect(() => {
    if (!isOpen || !fileKey) return;
    setError(null);
    setSchema([]);
    setLoading(true);

    const run = async () => {
      try {
        const res = await s3Service.getFileSchema(fileKey);
        setSchema(res.s3.s3FileSchema);
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
      title={`Column schema — ${titleName}`}
      size="lg"
    >
      {fileKey && (
        <p className="c360-text-muted c360-text-sm c360-mb-3">
          <span className="c360-text-muted">Key: </span>
          <code className="c360-file-detail__key c360-text-xs">{fileKey}</code>
        </p>
      )}
      <p className="c360-text-muted c360-text-xs c360-mb-3">
        Columns are inferred by the storage analysis service (same endpoint as{" "}
        <code className="c360-text-xs">/api/v1/analysis/schema</code> behind
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

      {!loading && !error && schema.length === 0 && (
        <p className="c360-text-muted">
          No schema columns returned. The file may be empty, unsupported, or
          analysis may not have run yet.
        </p>
      )}

      {!loading && !error && schema.length > 0 && (
        <div className="c360-table-wrapper c360-file-detail__preview-scroll">
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
    </Modal>
  );
}

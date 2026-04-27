"use client";

import { Fragment, useEffect, useState } from "react";
import { OpenJobsDrawerButton } from "@/components/feature/jobs/OpenJobsDrawerButton";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  formatDate,
  formatFileSize,
  normalizeS3FileSizeBytes,
} from "@/lib/utils";
import { jobsService, type JobRow } from "@/services/graphql/jobsService";
import type { S3FileInfo } from "@/graphql/generated/types";
import {
  isAllowedTabularFilename,
  tabularContentTypeFromFilename,
} from "@/lib/tabularUpload";

export interface S3FileJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: S3FileInfo | null;
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function fileContentHint(f: S3FileInfo): string | null {
  if (f.contentType) return f.contentType;
  if (isAllowedTabularFilename(f.filename))
    return tabularContentTypeFromFilename(f.filename);
  return null;
}

/**
 * Lists **scheduler_jobs** for the current user whose JSON payloads reference
 * this file’s logical S3 key (email finder/verify `inputCsvKey`, Connectra import
 * `s3_key`, status output keys, etc.) — see Jobs module + Connectra/email APIs.
 */
export function S3FileJobsModal({
  isOpen,
  onClose,
  file,
}: S3FileJobsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<JobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !file?.key) return;
    setError(null);
    setRows([]);
    setTotal(0);
    setExpandedJobId(null);
    setLoading(true);

    const run = async () => {
      try {
        const { jobs, pageInfo } = await jobsService.listRawForRelatedFile(
          file.key,
          { limit: 100 },
        );
        setRows(jobs);
        setTotal(pageInfo.total);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [isOpen, file?.key]);

  if (!file) return null;

  return (
    <Modal
      isOpen={isOpen && !!file.key}
      onClose={onClose}
      title={`Jobs for file — ${file.filename}`}
      size="lg"
    >
      <div className="c360-stack c360-mb-4">
        <h4 className="c360-text-sm c360-font-medium">File metadata</h4>
        <p className="c360-text-muted c360-text-sm">
          <span className="c360-text-muted">Key: </span>
          <code className="c360-file-detail__key c360-text-xs">{file.key}</code>
        </p>
        <div className="c360-flex c360-flex-wrap c360-gap-4 c360-text-sm c360-text-muted">
          {file.size != null && (
            <span>
              Size:{" "}
              <strong className="c360-text-primary">
                {formatFileSize(normalizeS3FileSizeBytes(file.size))}
              </strong>
            </span>
          )}
          {file.lastModified && (
            <span>
              Modified:{" "}
              <strong className="c360-text-primary">
                {formatDate(file.lastModified)}
              </strong>
            </span>
          )}
          {fileContentHint(file) && (
            <span>
              Type:{" "}
              <strong className="c360-text-primary">
                {fileContentHint(file)}
              </strong>
            </span>
          )}
        </div>
        <p className="c360-text-muted c360-text-xs">
          Jobs are matched when{" "}
          <code className="c360-text-xs">requestPayload</code>,{" "}
          <code className="c360-text-xs">responsePayload</code>, or{" "}
          <code className="c360-text-xs">statusPayload</code> contains this key
          (GraphQL{" "}
          <code className="c360-text-xs">jobs.jobs(relatedFileKey: …)</code>
          ).
        </p>
        <OpenJobsDrawerButton
          type="button"
          className="c360-text-sm c360-text-primary"
          onClick={() => onClose()}
        >
          Open full job manager →
        </OpenJobsDrawerButton>
      </div>

      {loading && (
        <div className="c360-table__loading c360-file-detail__loading">
          <span className="c360-spinner" />
        </div>
      )}

      {!loading && error && (
        <p className="c360-text-danger c360-text-sm">{error}</p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="c360-text-muted">
          No scheduler jobs reference this key in stored payloads (limit 100).
          Imports/exports/finder runs must have been recorded with this path in
          job metadata.
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          <p className="c360-text-muted c360-text-sm c360-mb-2">
            {total > rows.length
              ? `Showing ${rows.length} of ${total} matching jobs (cap 100 per request).`
              : `${rows.length} matching job${rows.length !== 1 ? "s" : ""}`}
          </p>
          <div className="c360-table-wrapper c360-file-detail__preview-scroll">
            <table className="c360-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Type</th>
                  <th>Family</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((j) => (
                  <Fragment key={j.jobId}>
                    <tr>
                      <td>
                        <code className="c360-text-xs">{j.jobId}</code>
                      </td>
                      <td className="c360-text-sm">{j.jobType}</td>
                      <td>
                        <Badge color="blue">{j.jobFamily}</Badge>
                      </td>
                      <td>{j.status}</td>
                      <td className="c360-text-muted c360-text-xs">
                        {j.sourceService}
                      </td>
                      <td className="c360-text-muted c360-text-xs">
                        {formatDate(j.createdAt)}
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedJobId((id) =>
                              id === j.jobId ? null : j.jobId,
                            )
                          }
                        >
                          {expandedJobId === j.jobId ? "Hide" : "Payloads"}
                        </Button>
                      </td>
                    </tr>
                    {expandedJobId === j.jobId && (
                      <tr>
                        <td colSpan={7} className="c360-bg-secondary">
                          <div className="c360-stack c360-gap-2 c360-p-2">
                            <div>
                              <div className="c360-text-muted c360-text-xs c360-mb-1">
                                requestPayload
                              </div>
                              <pre className="c360-file-detail__key c360-text-xs c360-file-detail__preview-scroll">
                                {formatJson(j.requestPayload ?? null)}
                              </pre>
                            </div>
                            <div>
                              <div className="c360-text-muted c360-text-xs c360-mb-1">
                                responsePayload
                              </div>
                              <pre className="c360-file-detail__key c360-text-xs c360-file-detail__preview-scroll">
                                {formatJson(j.responsePayload ?? null)}
                              </pre>
                            </div>
                            <div>
                              <div className="c360-text-muted c360-text-xs c360-mb-1">
                                statusPayload
                              </div>
                              <pre className="c360-file-detail__key c360-text-xs c360-file-detail__preview-scroll">
                                {formatJson(j.statusPayload ?? null)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}

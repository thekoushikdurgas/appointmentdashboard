"use client";

import { Upload, RefreshCw, FileText, HardDrive, Layers } from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Accordion } from "@/components/ui/Accordion";
import type { AccordionItem } from "@/components/ui/Accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";
import { useS3Files } from "@/hooks/useS3Files";
import { S3FileUploadModal } from "@/components/feature/files/S3FileUploadModal";
import { S3FileDetailModal } from "@/components/feature/files/S3FileDetailModal";
import { S3FileSchemaModal } from "@/components/feature/files/S3FileSchemaModal";
import { S3FileStatsModal } from "@/components/feature/files/S3FileStatsModal";
import { S3FilePreviewModal } from "@/components/feature/files/S3FilePreviewModal";
import { S3FileJobsModal } from "@/components/feature/files/S3FileJobsModal";
import { StartJobFromS3Modal } from "@/components/feature/jobs/StartJobFromS3Modal";
import { toast } from "sonner";
import type { S3FileInfo } from "@/graphql/generated/types";
import { s3Service } from "@/services/graphql/s3Service";
import { FilesDataTable } from "@/components/feature/files/FilesDataTable";
import { getStorageErrorMessage } from "@/lib/storageErrors";

type FolderScope = "all" | "upload" | "exports";

const STORAGE_NAMESPACE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isStorageNamespaceId(value: string): boolean {
  return STORAGE_NAMESPACE_UUID_RE.test(value.trim());
}

/** Format bytes as a human-readable string (B / KB / MB / GB). */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Derive a short summary of unique file extensions. */
function summariseFileTypes(files: S3FileInfo[]): string {
  const extCounts: Record<string, number> = {};
  for (const f of files) {
    const dot = f.filename?.lastIndexOf(".");
    const ext =
      dot !== undefined && dot >= 0
        ? f.filename!.slice(dot + 1).toUpperCase()
        : "OTHER";
    extCounts[ext] = (extCounts[ext] ?? 0) + 1;
  }
  const parts = Object.entries(extCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([ext, count]) => `${count} ${ext}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export default function FilesPage() {
  const [folderScope, setFolderScope] = useState<FolderScope>("all");
  const listPrefix = useMemo(() => {
    if (folderScope === "upload") return "upload/";
    if (folderScope === "exports") return "exports/";
    return undefined;
  }, [folderScope]);

  const {
    files,
    total,
    bucketName,
    loading,
    isRefreshing,
    isSkeletonLoading,
    uploading,
    error,
    lastRefreshed,
    deleteFile,
    getDownloadUrl,
    refresh,
    uploadCsvFile,
  } = useS3Files(listPrefix);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>("");
  const [deleting, setDeleting] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [detailSummary, setDetailSummary] = useState<S3FileInfo | null>(null);
  const [schemaKey, setSchemaKey] = useState<string | null>(null);
  const [schemaFileName, setSchemaFileName] = useState<string | null>(null);
  const [statsKey, setStatsKey] = useState<string | null>(null);
  const [statsFileName, setStatsFileName] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const [jobsContextFile, setJobsContextFile] = useState<S3FileInfo | null>(
    null,
  );
  const [startJobFile, setStartJobFile] = useState<S3FileInfo | null>(null);
  const [bucketMeta, setBucketMeta] = useState<Record<string, unknown> | null>(
    null,
  );
  const [bucketMetaLoading, setBucketMetaLoading] = useState(false);
  const [bucketMetaError, setBucketMetaError] = useState<string | null>(null);

  // Bulk delete: use ConfirmModal instead of window.confirm
  const [bulkDeletePending, setBulkDeletePending] = useState<string[]>([]);

  const loadBucketMetadata = useCallback(async () => {
    setBucketMetaLoading(true);
    setBucketMetaError(null);
    try {
      const res = await s3Service.getBucketMetadata();
      const raw = res.s3.s3BucketMetadata;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        setBucketMeta(raw as Record<string, unknown>);
      } else {
        setBucketMeta({});
      }
    } catch (e) {
      setBucketMetaError(getStorageErrorMessage(e));
    } finally {
      setBucketMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBucketMetadata();
  }, [loadBucketMetadata]);

  const handleRefreshAll = useCallback(() => {
    void refresh();
    void loadBucketMetadata();
  }, [refresh, loadBucketMetadata]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFile(deleteTarget);
      toast.success("File deleted.");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(getStorageErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (fileKey: string, fileName: string) => {
    setDownloadingKey(fileKey);
    try {
      const res = await getDownloadUrl(fileKey);
      const url = res.s3.s3FileDownloadUrl.downloadUrl;
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
    } catch (e) {
      toast.error(getStorageErrorMessage(e));
    } finally {
      setDownloadingKey(null);
    }
  };

  const openDetail = (f: S3FileInfo) => {
    setDetailKey(f.key);
    setDetailSummary(f);
  };

  const openSchema = (f: S3FileInfo) => {
    setSchemaKey(f.key);
    setSchemaFileName(f.filename);
  };

  const openStats = (f: S3FileInfo) => {
    setStatsKey(f.key);
    setStatsFileName(f.filename);
  };

  const openPreview = (f: S3FileInfo) => {
    setPreviewKey(f.key);
    setPreviewFileName(f.filename);
  };

  const openJobs = (f: S3FileInfo) => {
    setJobsContextFile(f);
  };

  /** Open ConfirmModal instead of window.confirm for bulk delete. */
  const handleBulkDelete = (keys: string[]) => {
    if (keys.length === 0) return;
    setBulkDeletePending(keys);
  };

  const executeBulkDelete = async () => {
    const keys = bulkDeletePending;
    setBulkDeletePending([]);
    let ok = 0;
    for (const key of keys) {
      try {
        await deleteFile(key);
        ok += 1;
      } catch (e) {
        toast.error(getStorageErrorMessage(e));
        break;
      }
    }
    if (ok > 0) {
      toast.success(
        ok === keys.length
          ? `Deleted ${ok} file(s).`
          : `Deleted ${ok} of ${keys.length} file(s).`,
      );
      void refresh();
    }
  };

  // Stat strip derived values
  const totalBytes = useMemo(
    () =>
      files.reduce((acc, f) => {
        const s = Number(f.size);
        return acc + (Number.isFinite(s) ? s : 0);
      }, 0),
    [files],
  );
  const fileTypesSummary = useMemo(() => summariseFileTypes(files), [files]);

  // Manifest accordion items derived from bucketMeta keys
  const manifestAccordionItems = useMemo<AccordionItem[]>(() => {
    if (!bucketMeta || Object.keys(bucketMeta).length === 0) return [];
    return Object.entries(bucketMeta).map(([folderKey, value]) => ({
      id: folderKey,
      title: (
        <span className="c360-manifest-accordion__key">
          <span className="c360-manifest-accordion__folder">{folderKey}/</span>
          {Array.isArray(value) && (
            <span className="c360-manifest-accordion__count c360-badge c360-badge--sm c360-badge--neutral">
              {value.length} file{value.length !== 1 ? "s" : ""}
            </span>
          )}
        </span>
      ),
      content: (
        <pre className="c360-manifest-accordion__pre c360-text-xs">
          {JSON.stringify(value, null, 2)}
        </pre>
      ),
    }));
  }, [bucketMeta]);

  const cardSubtitle = useMemo(() => {
    if (isRefreshing) return "Refreshing…";
    if (loading) return "Loading…";
    const count = `${total} file${total !== 1 ? "s" : ""}`;
    if (lastRefreshed) {
      return `${count} · last refreshed ${lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return count;
  }, [isRefreshing, loading, total, lastRefreshed]);

  return (
    <DashboardPageLayout>
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="c360-page-header">
        <div>
          <h1 className="c360-page-header__title">Files</h1>
          <p className="c360-page-header__subtitle">
            {bucketName
              ? isStorageNamespaceId(bucketName)
                ? "Personal storage — CSV uploads and exports for your account"
                : `${bucketName} — exported and uploaded objects`
              : "Manage your exported and uploaded files"}
          </p>
        </div>
        <div className="c360-badge-row">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={
              <RefreshCw size={14} className={cn(loading && "c360-spin")} />
            }
            onClick={handleRefreshAll}
            disabled={loading || bucketMetaLoading}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<Upload size={16} />}
            onClick={() => setUploadOpen(true)}
          >
            Upload files
          </Button>
        </div>
      </div>

      {/* ── Folder tabs ─────────────────────────────────────────────── */}
      <div className="c360-files-page__folder-tabs">
        <Tabs
          value={folderScope}
          onValueChange={(v) => setFolderScope(v as FolderScope)}
          variant="filter"
        >
          <TabsList>
            <TabsTrigger value="all">All files</TabsTrigger>
            <TabsTrigger value="upload">upload/</TabsTrigger>
            <TabsTrigger value="exports">exports/</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── Stat strip ──────────────────────────────────────────────── */}
      <div className="c360-files-stat-strip">
        <div className="c360-files-stat-card">
          <div className="c360-files-stat-card__icon">
            <FileText size={20} />
          </div>
          <div className="c360-files-stat-card__body">
            <span className="c360-files-stat-card__value">
              {loading && files.length === 0 ? "—" : total}
            </span>
            <span className="c360-files-stat-card__label">Total files</span>
          </div>
        </div>
        <div className="c360-files-stat-card">
          <div className="c360-files-stat-card__icon">
            <HardDrive size={20} />
          </div>
          <div className="c360-files-stat-card__body">
            <span className="c360-files-stat-card__value">
              {loading && files.length === 0 ? "—" : formatFileSize(totalBytes)}
            </span>
            <span className="c360-files-stat-card__label">Total size</span>
          </div>
        </div>
        <div className="c360-files-stat-card">
          <div className="c360-files-stat-card__icon">
            <Layers size={20} />
          </div>
          <div className="c360-files-stat-card__body">
            <span className="c360-files-stat-card__value c360-files-stat-card__value--sm">
              {loading && files.length === 0 ? "—" : fileTypesSummary}
            </span>
            <span className="c360-files-stat-card__label">File types</span>
          </div>
        </div>
      </div>

      {/* ── File table ──────────────────────────────────────────────── */}
      <Card title="Your files" subtitle={cardSubtitle}>
        {error ? (
          <div className="c360-text-danger c360-flex c360-flex-wrap c360-items-center c360-gap-2">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              leftIcon={
                <RefreshCw size={13} className={cn(loading && "c360-spin")} />
              }
              onClick={handleRefreshAll}
            >
              Retry
            </Button>
          </div>
        ) : (
          <FilesDataTable
            files={files}
            loading={loading}
            isSkeletonLoading={isSkeletonLoading}
            emptyHint={
              folderScope === "upload"
                ? "No files under upload/. Files stored at the root of your namespace appear only under All files — try that tab or upload with the upload/ prefix."
                : "No files in this view. Upload a tabular file or switch folder."
            }
            downloadingKey={downloadingKey}
            onUpload={() => setUploadOpen(true)}
            onOpenDetail={openDetail}
            onOpenSchema={openSchema}
            onOpenStats={openStats}
            onOpenPreview={openPreview}
            onOpenJobs={openJobs}
            onStartJob={(f) => setStartJobFile(f)}
            onDownload={(f) => void handleDownload(f.key, f.filename)}
            onDeleteRequest={(f) => {
              setDeleteTarget(f.key);
              setDeleteTargetName(f.filename);
            }}
            onBulkDelete={handleBulkDelete}
          />
        )}
      </Card>

      {/* ── Storage manifest accordion (bottom) ─────────────────────── */}
      <Card
        title="Storage manifest"
        subtitle={
          bucketMetaLoading
            ? "Loading…"
            : bucketMetaError
              ? "Could not load manifest"
              : "Aggregated file metadata written by the metadata worker (metadata.json)"
        }
        className="c360-mt-4"
      >
        {bucketMetaError ? (
          <p className="c360-text-danger c360-text-sm">{bucketMetaError}</p>
        ) : bucketMetaLoading && bucketMeta === null ? (
          <div className="c360-table__loading">
            <span className="c360-spinner" />
          </div>
        ) : manifestAccordionItems.length === 0 ? (
          <p className="c360-text-muted c360-text-sm">
            No manifest data yet. It is written as{" "}
            <code className="c360-text-xs">metadata.json</code> under your
            storage namespace after the metadata worker processes an upload.
          </p>
        ) : (
          <Accordion
            items={manifestAccordionItems}
            allowMultiple
            variant="bordered"
            className="c360-manifest-accordion"
          />
        )}
      </Card>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <S3FileUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        uploading={uploading}
        uploadCsvFile={uploadCsvFile}
        onUploaded={() => void refresh()}
      />

      <S3FileDetailModal
        isOpen={!!detailKey}
        onClose={() => {
          setDetailKey(null);
          setDetailSummary(null);
        }}
        fileKey={detailKey}
        summary={detailSummary ?? undefined}
      />

      <S3FileSchemaModal
        isOpen={!!schemaKey}
        onClose={() => {
          setSchemaKey(null);
          setSchemaFileName(null);
        }}
        fileKey={schemaKey}
        fileName={schemaFileName}
      />

      <S3FileStatsModal
        isOpen={!!statsKey}
        onClose={() => {
          setStatsKey(null);
          setStatsFileName(null);
        }}
        fileKey={statsKey}
        fileName={statsFileName}
      />

      <S3FilePreviewModal
        isOpen={!!previewKey}
        onClose={() => {
          setPreviewKey(null);
          setPreviewFileName(null);
        }}
        fileKey={previewKey}
        fileName={previewFileName}
      />

      <S3FileJobsModal
        isOpen={!!jobsContextFile}
        onClose={() => setJobsContextFile(null)}
        file={jobsContextFile}
      />

      {startJobFile ? (
        <StartJobFromS3Modal
          key={startJobFile.key}
          isOpen
          initialFile={startJobFile}
          onClose={() => setStartJobFile(null)}
          onJobCreated={() => void refresh()}
        />
      ) : null}

      {/* Single file delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete file?"
        message={`Are you sure you want to delete "${deleteTargetName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        processing={deleting}
      />

      {/* Bulk delete confirm — replaces window.confirm */}
      <ConfirmModal
        isOpen={bulkDeletePending.length > 0}
        onClose={() => setBulkDeletePending([])}
        onConfirm={executeBulkDelete}
        title={`Delete ${bulkDeletePending.length} file${bulkDeletePending.length !== 1 ? "s" : ""}?`}
        message={`This will permanently delete ${bulkDeletePending.length} selected file${bulkDeletePending.length !== 1 ? "s" : ""}. This action cannot be undone.`}
        confirmLabel="Delete all"
      />
    </DashboardPageLayout>
  );
}

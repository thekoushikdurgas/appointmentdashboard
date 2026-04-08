"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { readS3FilesCache, writeS3FilesCache } from "@/lib/s3FilesLocalCache";
import { s3Service } from "@/services/graphql/s3Service";
import { uploadCsvMultipartParts } from "@/lib/multipartCsvUpload";
import { tabularContentTypeFromFilename } from "@/lib/tabularUpload";
import { getStorageErrorMessage } from "@/lib/storageErrors";
import type { TabularMultipartProgressCallback } from "@/lib/multipartUploadTypes";
import type {
  S3FileInfo,
  S3FileStats,
  S3FileData,
  FileSchemaColumn,
} from "@/graphql/generated/types";

export function useS3Files(prefix?: string) {
  const [files, setFiles] = useState<S3FileInfo[]>(() => {
    const c = readS3FilesCache(prefix);
    return c?.files ?? [];
  });
  const [total, setTotal] = useState(
    () => readS3FilesCache(prefix)?.total ?? 0,
  );
  const [bucketName, setBucketName] = useState<string | null>(
    () => readS3FilesCache(prefix)?.bucketDisplayName ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Timestamp of the last successful fetchFiles() call. */
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  /** True only during the very first load when no cache is available. */
  const hasCache = useRef(!!readS3FilesCache(prefix));

  const isSkeletonLoading = loading && files.length === 0 && !hasCache.current;

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await s3Service.listFiles(prefix);
      setFiles(res.s3.s3Files.files);
      setTotal(res.s3.s3Files.total);
      setBucketName(res.s3.s3Files.bucketDisplayName ?? null);
      setLastRefreshed(new Date());
    } catch (e) {
      setError(getStorageErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [prefix]);

  /** When the list prefix changes, show the last saved manifest for that tab immediately. */
  useEffect(() => {
    const cached = readS3FilesCache(prefix);
    hasCache.current = !!cached;
    if (cached) {
      setFiles(cached.files);
      setTotal(cached.total);
      setBucketName(cached.bucketDisplayName);
    } else {
      setFiles([]);
      setTotal(0);
      setBucketName(null);
    }
  }, [prefix]);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  /** Keep localStorage aligned after API refresh, upload completion, or local delete. */
  useEffect(() => {
    if (loading) return;
    writeS3FilesCache(prefix, {
      bucketDisplayName: bucketName,
      total,
      files,
    });
  }, [prefix, files, total, bucketName, loading]);

  const getDownloadUrl = useCallback(
    (fileKey: string, expiresIn?: number) =>
      s3Service.getDownloadUrl(fileKey, expiresIn),
    [],
  );

  const getFileSchema = useCallback(
    async (fileKey: string): Promise<FileSchemaColumn[]> => {
      try {
        const res = await s3Service.getFileSchema(fileKey);
        return res.s3.s3FileSchema;
      } catch (e) {
        throw new Error(getStorageErrorMessage(e));
      }
    },
    [],
  );

  const getFileStats = useCallback(
    async (fileKey: string): Promise<S3FileStats> => {
      try {
        const res = await s3Service.getFileStats(fileKey);
        return res.s3.s3FileStats;
      } catch (e) {
        throw new Error(getStorageErrorMessage(e));
      }
    },
    [],
  );

  const getFileInfo = useCallback(
    async (fileKey: string): Promise<S3FileInfo> => {
      try {
        const res = await s3Service.getFileInfo(fileKey);
        return res.s3.s3FileInfo;
      } catch (e) {
        throw new Error(getStorageErrorMessage(e));
      }
    },
    [],
  );

  const uploadCsv = useCallback(
    async (
      filename: string,
      fileSize: number,
      uploadParts: (
        uploadId: string,
        fileKey: string,
        chunkSize: number,
        numParts: number,
      ) => Promise<Array<{ partNumber: number; etag: string }>>,
    ): Promise<S3FileInfo> => {
      setUploading(true);
      setError(null);
      try {
        const initRes = await s3Service.initiateCsvUpload({
          filename,
          fileSize,
        });
        const init = initRes.s3.initiateCsvUpload;
        await uploadParts(
          init.uploadId,
          init.fileKey,
          init.chunkSize,
          init.numParts,
        );
        const completeRes = await s3Service.completeCsvUpload({
          uploadId: init.uploadId,
        });
        await fetchFiles();
        // Avoid s3FileInfo round-trip (EC2 stub); use list + complete response for UI.
        const fk = completeRes.s3.completeCsvUpload.fileKey;
        return {
          key: fk,
          filename,
          size: String(fileSize),
          lastModified: null,
          contentType: tabularContentTypeFromFilename(filename),
        } as S3FileInfo;
      } catch (e) {
        const msg = getStorageErrorMessage(e);
        setError(msg);
        throw new Error(msg);
      } finally {
        setUploading(false);
      }
    },
    [fetchFiles],
  );

  const uploadCsvFile = useCallback(
    async (
      file: File,
      onProgress?: TabularMultipartProgressCallback,
    ): Promise<S3FileInfo> => {
      onProgress?.(0, file.size);
      return uploadCsv(
        file.name,
        file.size,
        (uploadId, _fk, chunkSize, numParts) =>
          uploadCsvMultipartParts(
            file,
            uploadId,
            chunkSize,
            numParts,
            onProgress,
          ),
      );
    },
    [uploadCsv],
  );

  const getFileData = useCallback(
    async (fileKey: string, limit = 50, offset = 0): Promise<S3FileData> => {
      try {
        const res = await s3Service.getFileData(fileKey, limit, offset);
        return res.s3.s3FileData;
      } catch (e) {
        throw new Error(getStorageErrorMessage(e));
      }
    },
    [],
  );

  const deleteFile = useCallback(async (fileKey: string) => {
    try {
      await s3Service.deleteFile(fileKey);
      setFiles((prev) => prev.filter((f) => f.key !== fileKey));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      throw new Error(getStorageErrorMessage(e));
    }
  }, []);

  const isRefreshing = loading && files.length > 0;

  return {
    files,
    total,
    bucketName,
    loading,
    isRefreshing,
    /** True on the very first load when no cache is available — show skeleton rows. */
    isSkeletonLoading,
    uploading,
    error,
    /** Date of the last successful file list refresh. */
    lastRefreshed,
    getDownloadUrl,
    getFileSchema,
    getFileStats,
    getFileInfo,
    getFileData,
    uploadCsv,
    uploadCsvFile,
    deleteFile,
    refresh: fetchFiles,
  };
}

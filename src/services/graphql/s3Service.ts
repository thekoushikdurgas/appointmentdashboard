import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";
import {
  S3_FILES_LIST,
  S3_DOWNLOAD_URL,
  S3_INITIATE_CSV_UPLOAD,
  S3_DELETE_FILE,
  S3_COMPLETE_CSV_UPLOAD,
  S3_FILE_DATA,
  S3_FILE_INFO,
  S3_FILE_SCHEMA,
  S3_FILE_STATS,
  S3_BUCKET_METADATA,
  S3_ABORT_UPLOAD,
  S3_JOBS_LIST,
} from "@/graphql/s3Operations";
import type {
  S3FileInfo,
  S3FileList,
  S3FileData,
  S3FileDataRow,
  S3FileStats,
  S3DownloadUrlResponse,
  FileSchemaColumn,
  InitiateUploadResponse,
  CompleteUploadResponse,
  Scalars,
} from "@/graphql/generated/types";

export type { S3FileInfo, S3FileList, S3FileData, S3FileDataRow, S3FileStats };

export type S3BucketMetadataJson = Scalars["JSON"]["output"];

export const s3Service = {
  listFiles: (prefix?: string) =>
    graphqlQuery<{ s3: { s3Files: S3FileList } }>(S3_FILES_LIST, {
      prefix: prefix ?? "",
    }),

  getDownloadUrl: (fileKey: string, expiresIn?: number) =>
    graphqlQuery<{ s3: { s3FileDownloadUrl: S3DownloadUrlResponse } }>(
      S3_DOWNLOAD_URL,
      { fileKey, expiresIn },
    ),

  initiateCsvUpload: (input: {
    filename: string;
    fileSize: string | number;
  }) => {
    const raw =
      typeof input.fileSize === "number"
        ? input.fileSize
        : Number(input.fileSize);
    const bytes = Number.isFinite(raw) && raw > 0 ? Math.trunc(raw) : 0;
    return graphqlMutation<{
      s3: { initiateCsvUpload: InitiateUploadResponse };
    }>(S3_INITIATE_CSV_UPLOAD, {
      input: {
        filename: input.filename,
        fileSize: String(bytes),
      },
    });
  },

  deleteFile: (fileKey: string) =>
    graphqlMutation<{ s3: { deleteFile: boolean } }>(S3_DELETE_FILE, {
      fileKey,
    }),

  completeCsvUpload: (input: { uploadId: string }) =>
    graphqlMutation<{ s3: { completeCsvUpload: CompleteUploadResponse } }>(
      S3_COMPLETE_CSV_UPLOAD,
      { input },
    ),

  getFileData: (fileKey: string, limit = 100, offset = 0) =>
    graphqlQuery<{ s3: { s3FileData: S3FileData } }>(S3_FILE_DATA, {
      fileKey,
      limit,
      offset,
    }),

  getFileInfo: (fileKey: string) =>
    graphqlQuery<{ s3: { s3FileInfo: S3FileInfo } }>(S3_FILE_INFO, {
      fileKey,
    }),

  getFileSchema: (fileKey: string) =>
    graphqlQuery<{ s3: { s3FileSchema: FileSchemaColumn[] } }>(S3_FILE_SCHEMA, {
      fileKey,
    }),

  getFileStats: (fileKey: string) =>
    graphqlQuery<{ s3: { s3FileStats: S3FileStats } }>(S3_FILE_STATS, {
      fileKey,
    }),

  getBucketMetadata: () =>
    graphqlQuery<{ s3: { s3BucketMetadata: S3BucketMetadataJson } }>(
      S3_BUCKET_METADATA,
    ),

  abortUpload: (uploadId: string) =>
    graphqlMutation<{
      upload: { abortUpload: { status: string; uploadId: string } };
    }>(S3_ABORT_UPLOAD, { input: { uploadId } }),

  listJobs: (bucketId?: string, state?: string) =>
    graphqlQuery<{
      s3: {
        s3Jobs: {
          jobs: Array<{
            id: number;
            bucketId: string;
            key: string;
            state: string;
            attempts: number;
            createdAt: string;
            updatedAt: string;
          }>;
          total: number;
          offset: number;
          nextOffset: number;
        };
      };
    }>(S3_JOBS_LIST, { bucketId, state }),

  /** @deprecated Use initiateCsvUpload + upload module for presigned parts. */
  getUploadUrl: (_input: { fileName: string; fileType: string }) => {
    throw new Error(
      "getUploadUrl removed — use s3.initiateCsvUpload and upload.presignedUrl",
    );
  },
};

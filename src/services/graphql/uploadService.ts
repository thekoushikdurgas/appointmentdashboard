import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";
import {
  UPLOAD_INITIATE,
  UPLOAD_REGISTER_PART,
  UPLOAD_COMPLETE,
  UPLOAD_ABORT,
  UPLOAD_STATUS,
  UPLOAD_PRESIGNED_URL,
} from "@/graphql/uploadOperations";
import type {
  InitiateUploadResponse,
  CompleteUploadResponse,
  AbortUploadResponse,
  UploadStatusResponse,
  InitiateUploadInput,
} from "@/graphql/generated/types";

export type {
  InitiateUploadResponse,
  CompleteUploadResponse,
  AbortUploadResponse,
  UploadStatusResponse,
};

export type { RegisterPartResponse } from "@/graphql/generated/types";

export const uploadService = {
  initiateUpload: (input: {
    filename: string;
    fileSize: number | string;
    contentType?: string | null;
    prefix?: string | null;
  }) => {
    const body: InitiateUploadInput = {
      filename: input.filename,
      fileSize: String(input.fileSize),
      contentType: input.contentType ?? "text/csv",
      prefix: input.prefix ?? undefined,
    };
    return graphqlMutation<{
      upload: { initiateUpload: InitiateUploadResponse };
    }>(UPLOAD_INITIATE, { input: body });
  },

  registerPart: (input: {
    uploadId: string;
    partNumber: number;
    etag: string;
  }) =>
    graphqlMutation<{
      upload: { registerPart: { partNumber: number; status: string } };
    }>(UPLOAD_REGISTER_PART, { input }),

  completeUpload: (input: { uploadId: string }) =>
    graphqlMutation<{ upload: { completeUpload: CompleteUploadResponse } }>(
      UPLOAD_COMPLETE,
      { input },
    ),

  abortUpload: (uploadId: string) =>
    graphqlMutation<{ upload: { abortUpload: AbortUploadResponse } }>(
      UPLOAD_ABORT,
      { input: { uploadId } },
    ),

  getUploadStatus: (uploadId: string) =>
    graphqlQuery<{ upload: { uploadStatus: UploadStatusResponse } }>(
      UPLOAD_STATUS,
      { uploadId },
    ),

  getPresignedUrl: (uploadId: string, partNumber: number) =>
    graphqlQuery<{
      upload: {
        presignedUrl: {
          presignedUrl: string | null;
          partNumber: number;
          alreadyUploaded: boolean;
          etag: string | null;
        };
      };
    }>(UPLOAD_PRESIGNED_URL, { uploadId, partNumber }),
};

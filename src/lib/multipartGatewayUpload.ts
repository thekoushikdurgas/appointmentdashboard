import { uploadService } from "@/services/graphql/uploadService";
import { uploadPresignedMultipartParts } from "@/lib/multipartCsvUpload";
import { tabularFilePutContentType } from "@/lib/tabularUpload";
import type { CompleteUploadResponse } from "@/graphql/generated/types";
import type { TabularMultipartProgressCallback } from "@/lib/multipartUploadTypes";

export interface UploadViaUploadModuleOptions {
  prefix?: string | null;
  contentType?: string;
  signal?: AbortSignal;
  onProgress?: TabularMultipartProgressCallback;
}

/**
 * Full gateway **`upload.*`** flow: initiate → presigned parts → complete.
 * On failure before complete, calls **`abortUpload`** best-effort.
 */
export async function uploadFileViaUploadModule(
  file: File,
  options: UploadViaUploadModuleOptions = {},
): Promise<CompleteUploadResponse> {
  const initRes = await uploadService.initiateUpload({
    filename: file.name,
    fileSize: file.size,
    contentType: options.contentType ?? tabularFilePutContentType(file),
    prefix: options.prefix,
  });
  const init = initRes.upload.initiateUpload;
  const uploadId = init.uploadId;
  let completed = false;

  try {
    await uploadPresignedMultipartParts(
      file,
      uploadId,
      init.chunkSize,
      init.numParts,
      options.onProgress,
      options.signal,
    );
    const done = await uploadService.completeUpload({ uploadId });
    completed = true;
    return done.upload.completeUpload;
  } catch (e) {
    if (!completed) {
      await uploadService.abortUpload(uploadId).catch(() => undefined);
    }
    throw e;
  }
}

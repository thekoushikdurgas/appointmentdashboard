import { uploadService } from "@/services/graphql/uploadService";
import { tabularFilePutContentType } from "@/lib/tabularUpload";
import type { TabularMultipartProgressCallback } from "@/lib/multipartUploadTypes";

function stripEtag(etag: string | null | undefined): string {
  return (etag ?? "").replace(/^"|"$/g, "").replace(/"/g, "");
}

/**
 * PUT each part using `upload.presignedUrl` + `upload.registerPart`
 * (works for sessions from `upload.initiateUpload` or `s3.initiateCsvUpload`).
 */
export async function uploadPresignedMultipartParts(
  file: File,
  uploadId: string,
  chunkSize: number,
  numParts: number,
  onProgress?: TabularMultipartProgressCallback,
  signal?: AbortSignal,
): Promise<Array<{ partNumber: number; etag: string }>> {
  const totalBytes = file.size;
  const partInfo = { partNumber: 1, numParts };
  onProgress?.(0, totalBytes, numParts > 0 ? partInfo : undefined);
  const putContentType = tabularFilePutContentType(file);
  const parts: Array<{ partNumber: number; etag: string }> = [];
  let uploadedSoFar = 0;

  for (let partNumber = 1; partNumber <= numParts; partNumber++) {
    signal?.throwIfAborted();
    onProgress?.(uploadedSoFar, totalBytes, { partNumber, numParts });
    const pres = await uploadService.getPresignedUrl(uploadId, partNumber);
    const row = pres.upload.presignedUrl;
    let etag: string;

    if (row.alreadyUploaded) {
      etag = stripEtag(row.etag);
      const start = (partNumber - 1) * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      uploadedSoFar += end - start;
      onProgress?.(uploadedSoFar, totalBytes, { partNumber, numParts });
      parts.push({ partNumber, etag });
      continue;
    }

    const url = row.presignedUrl;
    if (!url) {
      throw new Error(`No presigned URL for part ${partNumber}`);
    }

    const start = (partNumber - 1) * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const putRes = await fetch(url, {
      method: "PUT",
      body: chunk,
      signal,
      headers: { "Content-Type": putContentType },
    });

    if (!putRes.ok) {
      throw new Error(`Part ${partNumber} upload failed (${putRes.status})`);
    }

    etag = stripEtag(putRes.headers.get("ETag")) || stripEtag(row.etag);
    if (!etag) {
      throw new Error(`Missing ETag for part ${partNumber}`);
    }

    await uploadService.registerPart({ uploadId, partNumber, etag });
    uploadedSoFar += end - start;
    onProgress?.(uploadedSoFar, totalBytes, { partNumber, numParts });
    parts.push({ partNumber, etag });
  }

  return parts;
}

/** @deprecated Prefer `uploadPresignedMultipartParts`; kept for `useS3Files` imports. */
export const uploadCsvMultipartParts = uploadPresignedMultipartParts;

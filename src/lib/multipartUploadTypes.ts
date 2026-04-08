/** Optional 3rd argument to multipart `onProgress` — current part (1-based) and total parts. */
export type TabularMultipartPartInfo = {
  partNumber: number;
  numParts: number;
};

export type TabularMultipartProgressCallback = (
  uploadedBytes: number,
  totalBytes: number,
  part?: TabularMultipartPartInfo,
) => void;

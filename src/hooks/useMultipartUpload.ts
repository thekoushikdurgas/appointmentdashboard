"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { uploadFileViaUploadModule } from "@/lib/multipartGatewayUpload";
import type { CompleteUploadResponse } from "@/graphql/generated/types";

export type MultipartUploadPhase =
  | "idle"
  | "uploading"
  | "success"
  | "error"
  | "cancelled";

export type MultipartUploadProgressState = {
  value: number;
  max: number;
  partNumber: number;
  numParts: number;
};

export interface UseMultipartUploadOptions {
  onSuccess?: (result: CompleteUploadResponse) => void;
}

export function useMultipartUpload(options?: UseMultipartUploadOptions) {
  const onSuccessRef = useRef(options?.onSuccess);
  useEffect(() => {
    onSuccessRef.current = options?.onSuccess;
  }, [options?.onSuccess]);
  const [phase, setPhase] = useState<MultipartUploadPhase>("idle");
  const [progress, setProgress] = useState<MultipartUploadProgressState>({
    value: 0,
    max: 1,
    partNumber: 0,
    numParts: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompleteUploadResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current = null;
    setPhase("idle");
    setProgress({ value: 0, max: 1, partNumber: 0, numParts: 0 });
    setError(null);
    setResult(null);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const upload = useCallback(
    async (
      file: File,
      opts: { prefix?: string | null; contentType?: string },
    ) => {
      setError(null);
      setResult(null);
      setPhase("uploading");
      const maxBytes = Math.max(file.size, 1);
      setProgress({
        value: 0,
        max: maxBytes,
        partNumber: 0,
        numParts: 0,
      });
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const out = await uploadFileViaUploadModule(file, {
          prefix: opts.prefix,
          contentType: opts.contentType,
          signal: ac.signal,
          onProgress: (uploaded, total, part) => {
            setProgress({
              value: uploaded,
              max: Math.max(total, maxBytes),
              partNumber: part?.partNumber ?? 0,
              numParts: part?.numParts ?? 0,
            });
          },
        });
        setResult(out);
        setPhase("success");
        onSuccessRef.current?.(out);
        return out;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          setPhase("cancelled");
          setError("Upload cancelled.");
        } else {
          setPhase("error");
          setError(e instanceof Error ? e.message : String(e));
        }
        throw e;
      } finally {
        abortRef.current = null;
      }
    },
    [],
  );

  return {
    phase,
    progress,
    error,
    result,
    upload,
    cancel,
    reset,
    uploading: phase === "uploading",
  };
}

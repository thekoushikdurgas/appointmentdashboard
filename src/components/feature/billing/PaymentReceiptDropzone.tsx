"use client";

import { useRef, useCallback } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ACCEPT_ATTR = "image/jpeg,image/png,image/webp";

export interface PaymentReceiptDropzoneProps {
  uploading: boolean;
  /** e.g. last uploaded file name, or null when empty */
  statusLabel?: string | null;
  onFile: (file: File) => void;
}

export function PaymentReceiptDropzone({
  uploading,
  statusLabel,
  onFile,
}: PaymentReceiptDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      if (!ACCEPT_TYPES.includes(file.type as (typeof ACCEPT_TYPES)[number])) {
        toast.error("Please use a JPEG, PNG, or WebP image.");
        return;
      }
      onFile(file);
    },
    [onFile],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploading) return;
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="c360-sr-only"
        aria-label="Upload payment receipt image"
        tabIndex={-1}
        disabled={uploading}
        onChange={(e) => {
          handleFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <div
        className="c360-dropzone"
        data-busy={uploading ? "true" : undefined}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => {
          if (!uploading) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (uploading) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={uploading ? -1 : 0}
      >
        <Upload size={28} className="c360-dropzone__icon" />
        <p
          className={cn(
            "c360-dropzone__label",
            statusLabel && "c360-dropzone__label--selected",
          )}
        >
          {uploading
            ? "Uploading…"
            : (statusLabel ?? "Drop receipt image here or click to browse")}
        </p>
        <p className="c360-dropzone__hint">JPEG, PNG, or WebP · max 5 MB</p>
      </div>
    </>
  );
}

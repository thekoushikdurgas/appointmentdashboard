"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ResumeUploadDropzoneProps {
  disabled?: boolean;
  onFile: (file: File) => void;
}

export function ResumeUploadDropzone({
  disabled,
  onFile,
}: ResumeUploadDropzoneProps) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) onFile(f);
      e.target.value = "";
    },
    [onFile],
  );

  return (
    <div
      className={`c360-stat-card c360-p-4 ${drag ? "c360-ring-2 c360-ring-primary" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        aria-label="Upload résumé PDF or Word document"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="c360-hidden"
        disabled={disabled}
        onChange={(e) => void onChange(e)}
      />
      <div className="c360-flex c360-flex-col c360-items-center c360-gap-3 c360-text-center">
        <Upload size={28} className="c360-text-muted" />
        <p className="c360-text-sm c360-text-muted">
          Drop a PDF or DOCX here, or choose a file (max 4MB — enforced server-side).
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
      </div>
    </div>
  );
}

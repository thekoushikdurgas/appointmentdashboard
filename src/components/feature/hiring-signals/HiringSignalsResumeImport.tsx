"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { suggestHireSignalFiltersFromResume } from "@/services/graphql/hiringSignalService";
import { toast } from "sonner";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result ?? "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

export interface HiringSignalsResumeImportProps {
  onSuggested: (
    titles: string[],
    locations: string[],
    ext: Record<string, unknown>,
  ) => void;
}

export function HiringSignalsResumeImport({
  onSuggested,
}: HiringSignalsResumeImportProps) {
  const inp = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(f: File | null) {
    if (!f) return;
    setBusy(true);
    try {
      const b64 = await fileToBase64(f);
      const res = await suggestHireSignalFiltersFromResume(b64, f.name);
      const raw =
        res.hireSignal?.suggestHireSignalFiltersFromResumeUpload ?? null;
      const o =
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
      const titles = Array.isArray(o.primaryTitleTokens)
        ? (o.primaryTitleTokens as string[])
        : [];
      const locations = Array.isArray(o.locationTokens)
        ? (o.locationTokens as string[])
        : [];
      const extRaw = o.extendedJobFiltersSuggestion;
      const ext =
        extRaw && typeof extRaw === "object"
          ? (extRaw as Record<string, unknown>)
          : {};
      onSuggested(titles, locations, ext);
      toast.success("Resume parsed — review filters before searching.");
    } catch {
      toast.error("Could not parse resume.");
    } finally {
      setBusy(false);
      if (inp.current) inp.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inp}
        type="file"
        className="c360-sr-only"
        accept=".pdf,.doc,.docx,.txt,application/pdf"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inp.current?.click()}
      >
        {busy ? "Parsing…" : "Import resume"}
      </Button>
    </>
  );
}

"use client";

import { Button } from "@/components/ui/Button";

interface CoverLetterPanelProps {
  text: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  onDownloadPdf: () => void;
  generating?: boolean;
  downloading?: boolean;
  /** Tailored résumés only (server validates ``parent_id``). */
  canGenerate: boolean;
}

export function CoverLetterPanel({
  text,
  onChange,
  onGenerate,
  onDownloadPdf,
  generating,
  downloading,
  canGenerate,
}: CoverLetterPanelProps) {
  return (
    <div className="c360-stat-card c360-p-4 c360-space-y-4">
      <div className="c360-flex c360-flex-wrap c360-gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={generating}
          disabled={!canGenerate}
          onClick={() => void onGenerate()}
        >
          Generate cover letter
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={downloading}
          disabled={!text.trim()}
          onClick={() => void onDownloadPdf()}
        >
          Download PDF
        </Button>
      </div>
      {!canGenerate && (
        <p className="c360-text-xs c360-text-muted">
          Generate is available after you confirm a tailored résumé for this job
          (server links cover letter context via the improvements record).
        </p>
      )}
      <div>
        <label className="c360-label" htmlFor="cover-letter">
          Cover letter
        </label>
        <textarea
          id="cover-letter"
          className="c360-input"
          rows={14}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Generate or paste your cover letter…"
        />
      </div>
    </div>
  );
}

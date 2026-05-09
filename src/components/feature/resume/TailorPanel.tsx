"use client";

import { Button } from "@/components/ui/Button";
import {
  DEFAULT_IMPROVE_PROMPT_ID,
  IMPROVE_PROMPT_OPTIONS,
} from "@/lib/resumeAiPrompts";

interface TailorPanelProps {
  jobDescription: string;
  onJobDescriptionChange: (v: string) => void;
  selectedPromptId: string;
  onPromptChange: (id: string) => void;
  onSaveJob: () => void;
  onPreview: () => void;
  jobId: string | null;
  savingJob?: boolean;
  previewLoading?: boolean;
  disabled?: boolean;
}

export function TailorPanel({
  jobDescription,
  onJobDescriptionChange,
  selectedPromptId,
  onPromptChange,
  onSaveJob,
  onPreview,
  jobId,
  savingJob,
  previewLoading,
  disabled,
}: TailorPanelProps) {
  return (
    <div className="c360-stat-card c360-p-4 c360-space-y-4">
      <div>
        <label className="c360-label" htmlFor="jd-text">
          Job description
        </label>
        <textarea
          id="jd-text"
          className="c360-input"
          rows={10}
          value={jobDescription}
          disabled={disabled}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          placeholder="Paste the job posting text here…"
        />
      </div>
      <div className="c360-flex c360-flex-wrap c360-gap-3 c360-items-end">
        <div className="c360-flex-1 c360-min-w-[200px]">
          <label className="c360-label" htmlFor="prompt-select">
            Tailoring style
          </label>
          <select
            id="prompt-select"
            className="c360-input"
            value={selectedPromptId}
            disabled={disabled}
            onChange={(e) => onPromptChange(e.target.value)}
          >
            {IMPROVE_PROMPT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="c360-text-xs c360-text-muted c360-mt-1">
            Default in Resume Matcher:{" "}
            <code className="c360-mono">{DEFAULT_IMPROVE_PROMPT_ID}</code>
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          loading={savingJob}
          disabled={disabled || !jobDescription.trim()}
          onClick={() => void onSaveJob()}
        >
          Save job to session
        </Button>
        <Button
          type="button"
          variant="primary"
          loading={previewLoading}
          disabled={disabled || !jobId}
          onClick={() => void onPreview()}
        >
          Preview tailoring
        </Button>
      </div>
      {jobId && (
        <p className="c360-text-xs c360-text-muted">
          Job id: <code className="c360-mono">{jobId}</code>
        </p>
      )}
    </div>
  );
}

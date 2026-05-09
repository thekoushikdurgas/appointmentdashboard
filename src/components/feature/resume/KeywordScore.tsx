"use client";

import { Button } from "@/components/ui/Button";

interface KeywordScoreProps {
  jobId: string | null;
  score: number | null;
  loading?: boolean;
  onCompute: () => void;
}

export function KeywordScore({
  jobId,
  score,
  loading,
  onCompute,
}: KeywordScoreProps) {
  return (
    <div className="c360-stat-card c360-p-4">
      <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-3">
        <div>
          <div className="c360-text-sm c360-text-muted">Keyword alignment</div>
          <div className="c360-text-2xl c360-font-semibold">
            {score == null ? "—" : `${score.toFixed(1)}%`}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={loading}
          disabled={!jobId}
          onClick={() => void onCompute()}
        >
          Compute vs saved job
        </Button>
      </div>
      {!jobId && (
        <p className="c360-text-xs c360-text-muted c360-mt-2">
          Save a job description in the Tailor tab first.
        </p>
      )}
    </div>
  );
}

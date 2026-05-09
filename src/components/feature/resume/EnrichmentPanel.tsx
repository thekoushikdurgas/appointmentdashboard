"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { resumeAiEnrichmentAnalyze } from "@/lib/resumeAiClient";

interface EnrichmentPanelProps {
  resumeId: string;
  disabled?: boolean;
}

export function EnrichmentPanel({ resumeId, disabled }: EnrichmentPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setErr(null);
    try {
      const j = await resumeAiEnrichmentAnalyze(resumeId);
      setResult(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="c360-stat-card c360-p-4 c360-space-y-3">
      <div className="c360-flex c360-items-center c360-gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={loading}
          disabled={disabled}
          onClick={() => void run()}
        >
          AI: analyze weak bullets
        </Button>
      </div>
      {err && <p className="c360-text-sm c360-text-danger">{err}</p>}
      {result != null && (
        <pre className="c360-text-xs c360-overflow-auto c360-max-h-80 c360-p-2 c360-rounded" style={{ background: "var(--c360-bg-muted, #f4f4f5)" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

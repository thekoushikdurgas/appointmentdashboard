"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RadioGroup, Radio } from "@/components/ui/Radio";
import { triggerHireSignalScrapeAndTrack } from "@/services/graphql/hiringSignalService";
import {
  parseGraphQLError,
  type GraphQLErrorResponse,
} from "@/lib/graphqlClient";
import { toast } from "sonner";

/** Matches scraper.server reschedule_after_hours max (168 hours). */
const MAX_RESCHEDULE_AFTER_HOURS = 168;

export interface RunScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RunScrapeModal({
  isOpen,
  onClose,
  onSuccess,
}: RunScrapeModalProps) {
  const [keywords, setKeywords] = useState("Oracle");
  const [geoId, setGeoId] = useState(103644278);
  const [count, setCount] = useState(1000);
  const [enableEnrichment, setEnableEnrichment] = useState(true);
  const [trigger, setTrigger] = useState("manual");
  /** Empty string = omit from payload; scraper repeats after N hours when set (> 0). */
  const [repeatAfterHours, setRepeatAfterHours] = useState("2");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) setValidationError(null);
  }, [isOpen]);

  const reset = useCallback(() => {
    setKeywords("Oracle");
    setGeoId(103644278);
    setCount(1000);
    setEnableEnrichment(true);
    setTrigger("manual");
    setRepeatAfterHours("2");
    setValidationError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!keywords.trim()) {
      setValidationError("Enter search keywords.");
      return;
    }
    if (!Number.isFinite(geoId) || geoId <= 0) {
      setValidationError("Enter a valid LinkedIn geoId (e.g. 105080838).");
      return;
    }
    const rsCommon = repeatAfterHours.trim();
    if (rsCommon !== "") {
      const n = Math.floor(Number(rsCommon));
      if (!Number.isFinite(n) || n < 0) {
        setValidationError(
          "Repeat after hours must be a whole number between 0 and 168.",
        );
        return;
      }
      if (n > MAX_RESCHEDULE_AFTER_HOURS) {
        setValidationError(
          `Repeat after hours must be at most ${MAX_RESCHEDULE_AFTER_HOURS}.`,
        );
        return;
      }
    }
    setValidationError(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        trigger: trigger.trim() || "manual",
        keywords: keywords.trim(),
        geo_id: geoId,
        max_jobs: Number.isFinite(count) ? count : 100,
        enable_enrichment: enableEnrichment,
        batch_size: 25,
      };
      if (enableEnrichment) {
        body.openai_model = "gpt-4o-mini";
      }
      const rs = repeatAfterHours.trim();
      if (rs !== "") {
        const n = Math.floor(Number(rs));
        if (n > 0) {
          body.reschedule_after_hours = n;
        }
      }
      const res = await triggerHireSignalScrapeAndTrack(body);
      const row = res.hireSignal?.triggerScrapeAndTrack;
      if (row && typeof row === "object" && "id" in row) {
        toast.success("Scrape queued and tracked", {
          description: `Scrape job ${String((row as { id: string }).id).slice(0, 8)}… — check the Runs tab.`,
        });
        onSuccess?.();
        onClose();
        reset();
      } else {
        toast.message("Unexpected response", {
          description: JSON.stringify(row),
        });
      }
    } catch (e) {
      let m = e instanceof Error ? e.message : "Request failed";
      if (e && typeof e === "object" && "response" in e) {
        const resp = (e as { response?: { errors?: GraphQLErrorResponse[] } })
          .response;
        const errors = resp?.errors;
        if (Array.isArray(errors) && errors.length > 0) {
          const pe = parseGraphQLError(errors);
          m = pe.detail || pe.message;
        }
      }
      toast.error("Scrape failed", { description: m });
    } finally {
      setSubmitting(false);
    }
  }, [
    keywords,
    geoId,
    count,
    enableEnrichment,
    trigger,
    repeatAfterHours,
    onClose,
    onSuccess,
    reset,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Run job scrape"
      size="lg"
      footer={
        <div className="c360-flex c360-w-full c360-items-center c360-justify-end c360-gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Queue scrape"}
          </Button>
        </div>
      }
    >
      <p className="c360-mb-4 c360-text-2xs c360-text-muted">
        Queued via <code>triggerScrapeAndTrack</code> →{" "}
        <strong>scraper.server</strong> (LinkedIn HTML scraper via Celery).
        Payload sent directly as <code>POST /scrape/start</code> snake_case
        fields.
      </p>
      {validationError ? (
        <Alert variant="danger" className="c360-mb-3" title="Check your input">
          {validationError}
        </Alert>
      ) : null}
      <div className="c360-flex c360-flex-col c360-gap-3">
        <div className="c360-flex c360-flex-col c360-gap-2">
          <span className="c360-text-2xs c360-font-medium c360-text-ink">
            Trigger
          </span>
          <RadioGroup
            name="hs-trigger"
            value={trigger}
            onChange={setTrigger}
            horizontal
            className="c360-flex-wrap"
          >
            <Radio value="manual" label="Manual" />
            <Radio value="api" label="API" />
            <Radio value="cron" label="Cron / scheduled" />
          </RadioGroup>
        </div>
        <label className="c360-flex c360-flex-col c360-gap-1">
          <span className="c360-text-2xs c360-font-medium c360-text-ink">
            Keywords
          </span>
          <input
            type="text"
            className="c360-rounded c360-border c360-border-ink-8 c360-bg-ink-1 c360-px-2 c360-py-1.5 c360-text-sm"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder='e.g. "golang developer OR kubernetes"'
          />
        </label>
        <label className="c360-flex c360-flex-col c360-gap-1">
          <span className="c360-text-2xs c360-font-medium c360-text-ink">
            LinkedIn geoId
          </span>
          <input
            type="number"
            min={1}
            className="c360-rounded c360-border c360-border-ink-8 c360-bg-ink-1 c360-px-2 c360-py-1.5 c360-text-sm"
            value={geoId}
            onChange={(e) => setGeoId(Number(e.target.value))}
          />
          <span className="c360-text-2xs c360-text-muted">
            Example: 103644278 (United States), 103644278 (India).
          </span>
        </label>
        <label className="c360-flex c360-flex-col c360-gap-1">
          <span className="c360-text-2xs c360-font-medium c360-text-ink">
            Max jobs
          </span>
          <input
            type="number"
            min={1}
            className="c360-rounded c360-border c360-border-ink-8 c360-bg-ink-1 c360-px-2 c360-py-1.5 c360-text-sm"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <label className="c360-flex c360-items-center c360-gap-2">
          <input
            type="checkbox"
            checked={enableEnrichment}
            onChange={(e) => setEnableEnrichment(e.target.checked)}
          />
          <span className="c360-text-sm c360-text-ink">
            Enable company website enrichment (OpenAI on scraper)
          </span>
        </label>
        <label className="c360-flex c360-flex-col c360-gap-1">
          <span className="c360-text-2xs c360-font-medium c360-text-ink">
            Repeat scrape after (hours, optional)
          </span>
          <input
            type="number"
            min={0}
            max={MAX_RESCHEDULE_AFTER_HOURS}
            step={1}
            className="c360-rounded c360-border c360-border-ink-8 c360-bg-ink-1 c360-px-2 c360-py-1.5 c360-text-sm"
            value={repeatAfterHours}
            onChange={(e) => setRepeatAfterHours(e.target.value)}
            placeholder="No repeat"
            aria-describedby="hs-reschedule-hint"
          />
          <span
            id="hs-reschedule-hint"
            className="c360-text-2xs c360-text-muted"
          >
            Sent as <code>reschedule_after_hours</code> to{" "}
            <code className="c360-break-all">POST /scrape/start</code>. After
            completion, scraper re-queues via Celery. Leave empty or 0 for one
            shot.
          </span>
        </label>
      </div>
    </Modal>
  );
}

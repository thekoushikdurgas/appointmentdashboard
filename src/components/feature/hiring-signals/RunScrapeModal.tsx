"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RadioGroup, Radio } from "@/components/ui/Radio";
import { triggerHireSignalScrapeAndTrack } from "@/services/graphql/hiringSignalService";
import { toast } from "sonner";

const DEFAULT_URL =
  "https://www.linkedin.com/jobs/search/?keywords=golang&position=1&pageNum=0";

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
  const [urlsText, setUrlsText] = useState(DEFAULT_URL);
  const [count, setCount] = useState(100);
  const [scrapeCompany, setScrapeCompany] = useState(false);
  const [splitByLocation, setSplitByLocation] = useState(false);
  const [trigger, setTrigger] = useState("manual");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) setValidationError(null);
  }, [isOpen]);

  const reset = useCallback(() => {
    setUrlsText(DEFAULT_URL);
    setCount(100);
    setScrapeCompany(false);
    setSplitByLocation(false);
    setTrigger("manual");
    setValidationError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    const lines = urlsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setValidationError(
        "Add at least one URL (one per line in the box below).",
      );
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        trigger: trigger.trim() || "manual",
        urls: lines,
        count: Number.isFinite(count) ? count : 100,
        scrapeCompany,
        splitByLocation,
      };
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
      const m = e instanceof Error ? e.message : "Request failed";
      toast.error("Scrape", { description: m });
    } finally {
      setSubmitting(false);
    }
  }, [
    urlsText,
    count,
    scrapeCompany,
    splitByLocation,
    trigger,
    onClose,
    onSuccess,
    reset,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Run Apify scrape"
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
        Body is sent to the gateway as{" "}
        <code className="c360-break-all">triggerScrapeAndTrack</code> (saved in
        Postgres + forwarded to job.server with your scrape parameters).
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
            URLs (one per line)
          </span>
          <textarea
            className="c360-min-h-[120px] c360-rounded c360-border c360-border-ink-8 c360-bg-ink-1 c360-p-2 c360-font-mono c360-text-2xs"
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            spellCheck={false}
          />
        </label>
        <label className="c360-flex c360-flex-col c360-gap-1">
          <span className="c360-text-2xs c360-font-medium c360-text-ink">
            Count
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
            checked={scrapeCompany}
            onChange={(e) => setScrapeCompany(e.target.checked)}
          />
          <span className="c360-text-sm c360-text-ink">scrapeCompany</span>
        </label>
        <label className="c360-flex c360-items-center c360-gap-2">
          <input
            type="checkbox"
            checked={splitByLocation}
            onChange={(e) => setSplitByLocation(e.target.checked)}
          />
          <span className="c360-text-sm c360-text-ink">splitByLocation</span>
        </label>
      </div>
    </Modal>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RadioGroup, Radio } from "@/components/ui/Radio";
import { triggerHireSignalScrapeAndTrack } from "@/services/graphql/hiringSignalService";
import { toast } from "sonner";

const DEFAULT_URL =
  "https://www.linkedin.com/jobs/search/?keywords=golang&geoId=105080838&position=1&pageNum=0";

/** Matches job.server `maxRescheduleAfterHours` (hours). */
const MAX_RESCHEDULE_AFTER_HOURS = 168;

type ScrapeMode = "keywords" | "urls";

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
  const [mode, setMode] = useState<ScrapeMode>("keywords");
  const [keywords, setKeywords] = useState("golang developer");
  const [geoId, setGeoId] = useState(105080838);
  const [urlsText, setUrlsText] = useState(DEFAULT_URL);
  const [count, setCount] = useState(100);
  const [enableEnrichment, setEnableEnrichment] = useState(false);
  const [scrapeCompany, setScrapeCompany] = useState(false);
  const [splitByLocation, setSplitByLocation] = useState(false);
  const [trigger, setTrigger] = useState("manual");
  /** Empty string = omit from payload; scraper repeats after N hours when set (> 0). */
  const [rescheduleAfterHours, setRescheduleAfterHours] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) setValidationError(null);
  }, [isOpen]);

  const reset = useCallback(() => {
    setMode("keywords");
    setKeywords("golang developer");
    setGeoId(105080838);
    setUrlsText(DEFAULT_URL);
    setCount(100);
    setEnableEnrichment(false);
    setScrapeCompany(false);
    setSplitByLocation(false);
    setTrigger("manual");
    setRescheduleAfterHours("");
    setValidationError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (mode === "urls") {
      const lines = urlsText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (lines.length === 0) {
        setValidationError(
          "Add at least one LinkedIn jobs search URL (one per line).",
        );
        return;
      }
    } else {
      if (!keywords.trim()) {
        setValidationError("Enter search keywords.");
        return;
      }
      if (!Number.isFinite(geoId) || geoId <= 0) {
        setValidationError("Enter a valid LinkedIn geoId (e.g. 105080838).");
        return;
      }
      const rs = rescheduleAfterHours.trim();
      if (rs !== "") {
        const n = Math.floor(Number(rs));
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
    }
    setValidationError(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        trigger: trigger.trim() || "manual",
        mode,
      };
      if (mode === "keywords") {
        body.keywords = keywords.trim();
        body.geoId = geoId;
        body.maxJobs = Number.isFinite(count) ? count : 100;
        body.enableEnrichment = enableEnrichment;
        const rs = rescheduleAfterHours.trim();
        if (rs !== "") {
          const n = Math.floor(Number(rs));
          if (n > 0) {
            body.rescheduleAfterHours = n;
          }
        }
      } else {
        const lines = urlsText
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        body.urls = lines;
        body.maxJobs = Number.isFinite(count) ? count : 100;
        body.scrapeCompany = scrapeCompany;
        body.splitByLocation = splitByLocation;
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
      const m = e instanceof Error ? e.message : "Request failed";
      toast.error("Scrape", { description: m });
    } finally {
      setSubmitting(false);
    }
  }, [
    mode,
    keywords,
    geoId,
    urlsText,
    count,
    enableEnrichment,
    scrapeCompany,
    splitByLocation,
    trigger,
    rescheduleAfterHours,
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
        Queued via <code>triggerScrapeAndTrack</code> → job.server →{" "}
        <strong>scraper.server</strong> (LinkedIn HTML scraper). Keywords + geo
        mode is preferred. URL mode is legacy (Apify) and requires a{" "}
        <code>keywords=</code> param in the URL for scraper-based ingest.
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
        <div className="c360-flex c360-flex-col c360-gap-2">
          <span className="c360-text-2xs c360-font-medium c360-text-ink">
            Search mode
          </span>
          <RadioGroup
            name="hs-mode"
            value={mode}
            onChange={(v) => setMode(v as ScrapeMode)}
            horizontal
            className="c360-flex-wrap"
          >
            <Radio value="keywords" label="Keywords + geo (scraper.server)" />
            <Radio value="urls" label="LinkedIn URLs (Apify legacy)" />
          </RadioGroup>
        </div>
        {mode === "keywords" ? (
          <>
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
                Example: 105080838 (United States), 103644278 (India).
              </span>
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
                value={rescheduleAfterHours}
                onChange={(e) => setRescheduleAfterHours(e.target.value)}
                placeholder="No repeat"
                aria-describedby="hs-reschedule-hint"
              />
              <span
                id="hs-reschedule-hint"
                className="c360-text-2xs c360-text-muted"
              >
                After the run completes, scraper.server can queue the same
                search again via Celery (not a second tracked run in
                job.server). Leave empty or 0 for a single run.
              </span>
            </label>
          </>
        ) : (
          <label className="c360-flex c360-flex-col c360-gap-1">
            <span className="c360-text-2xs c360-font-medium c360-text-ink">
              LinkedIn jobs search URLs (one per line)
            </span>
            <textarea
              className="c360-min-h-[120px] c360-rounded c360-border c360-border-ink-8 c360-bg-ink-1 c360-p-2 c360-font-mono c360-text-2xs"
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              spellCheck={false}
            />
            <span className="c360-text-2xs c360-text-muted">
              URLs must include a{" "}
              <code className="c360-break-all">keywords=</code> query param for
              scraper-based ingest.
            </span>
          </label>
        )}
        <label className="c360-flex c360-flex-col c360-gap-1">
          <span className="c360-text-2xs c360-font-medium c360-text-ink">
            {mode === "keywords" ? "Max jobs" : "Count / max jobs"}
          </span>
          <input
            type="number"
            min={1}
            className="c360-rounded c360-border c360-border-ink-8 c360-bg-ink-1 c360-px-2 c360-py-1.5 c360-text-sm"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        {mode === "urls" ? (
          <>
            <label className="c360-flex c360-items-center c360-gap-2">
              <input
                type="checkbox"
                checked={scrapeCompany}
                onChange={(e) => setScrapeCompany(e.target.checked)}
              />
              <span className="c360-text-sm c360-text-ink">
                scrapeCompany{" "}
                <span className="c360-text-muted">(Apify only)</span>
              </span>
            </label>
            <label className="c360-flex c360-items-center c360-gap-2">
              <input
                type="checkbox"
                checked={splitByLocation}
                onChange={(e) => setSplitByLocation(e.target.checked)}
              />
              <span className="c360-text-sm c360-text-ink">
                splitByLocation{" "}
                <span className="c360-text-muted">(Apify only)</span>
              </span>
            </label>
          </>
        ) : null}
      </div>
    </Modal>
  );
}

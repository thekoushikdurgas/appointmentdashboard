"use client";

import { useState } from "react";
import { Ban, Pause, Play, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Alert } from "@/components/ui/Alert";
import { Tooltip } from "@/components/ui/Tooltip";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatDate } from "@/lib/utils";
import {
  parseScrapeRequestBody,
  scrapeStatusBadgeColor,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import {
  hireSignalRunCanCancel,
  hireSignalRunCanPause,
  hireSignalRunCanResume,
} from "@/hooks/useHireSignalRuns";

export interface ScrapeSessionCardProps {
  row: Record<string, unknown>;
  showManageActions: boolean;
  onDrillSignals: (runId: string) => void;
  onCancel: (runId: string) => void;
  onPause: (runId: string) => void;
  onResume: (runId: string) => void;
  onDownloadCsv: (scrapeJobId: string) => void;
  onRefresh: (runId: string) => void;
  cancelRunId: string | null;
  pauseRunId: string | null;
  resumeRunId: string | null;
  scrapeDownloadId: string | null;
  runActionId: string | null;
}

export function ScrapeSessionCard({
  row,
  showManageActions,
  onDrillSignals,
  onCancel,
  onPause,
  onResume,
  onDownloadCsv,
  onRefresh,
  cancelRunId,
  pauseRunId,
  resumeRunId,
  scrapeDownloadId,
  runActionId,
}: ScrapeSessionCardProps) {
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const id = String(row.id ?? "");
  const status = String(row.status ?? "—");
  const runIdVal = String(row.runId ?? "").trim();
  const err = row.error != null ? String(row.error) : "";
  const req = parseScrapeRequestBody(row.requestBody);
  const itemRaw = row.itemCount ?? row.item_count;
  const itemCount =
    itemRaw != null && itemRaw !== "" ? Number(itemRaw) : undefined;
  const maxGoal = req.maxJobs != null && req.maxJobs > 0 ? req.maxJobs : 100;
  const progressValue =
    itemCount != null && Number.isFinite(itemCount)
      ? Math.min(itemCount, maxGoal)
      : 0;
  const st = status.toLowerCase();
  const collected =
    itemCount != null && Number.isFinite(itemCount)
      ? Math.max(0, Math.floor(itemCount))
      : 0;
  const target =
    req.maxJobs != null && req.maxJobs > 0 ? req.maxJobs : null;
  const progressColor =
    st === "failed"
      ? "danger"
      : st === "done" && target != null && collected < target * 0.5
        ? "warning"
        : st === "done"
          ? "success"
          : st === "pending"
            ? "warning"
            : "primary";

  const canCancel =
    showManageActions && !!runIdVal && hireSignalRunCanCancel(status);
  const canPause =
    showManageActions && !!runIdVal && hireSignalRunCanPause(status);
  const canResume =
    showManageActions && !!runIdVal && hireSignalRunCanResume(status);

  return (
    <>
      <Card className="c360-hs-scrape-session-card c360-flex c360-h-full c360-flex-col c360-gap-3 c360-p-4">
        <div className="c360-flex c360-flex-wrap c360-items-start c360-justify-between c360-gap-2">
          <div className="c360-hs-scrape-session-card__header c360-min-w-0">
            <Tooltip content={id || "—"} placement="top">
              <span className="c360-font-mono c360-text-2xs c360-text-ink">
                {id.length > 14 ? `${id.slice(0, 14)}…` : id || "—"}
              </span>
            </Tooltip>
            <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2">
              <Badge color={scrapeStatusBadgeColor(status)} size="sm">
                {status}
              </Badge>
              <span className="c360-text-2xs c360-text-muted">
                Created{" "}
                {formatDate(String(row.createdAt ?? "") || undefined) || "—"}
              </span>
            </div>
            <p className="c360-m-0 c360-text-2xs c360-text-muted">
              {(itemCount != null && Number.isFinite(itemCount)
                ? Math.max(0, Math.floor(itemCount))
                : 0
              ).toLocaleString()}
              {req.maxJobs != null && req.maxJobs > 0
                ? ` / ${req.maxJobs.toLocaleString()}`
                : ""}{" "}
              jobs
            </p>
          </div>
        </div>

        <div className="c360-hs-scrape-session-card__meta c360-text-2xs c360-text-ink">
          {req.keywords ? (
            <p className="c360-m-0">
              <span className="c360-font-medium">Keywords:</span>{" "}
              <span className="c360-break-words">{req.keywords}</span>
            </p>
          ) : null}
          <p className="c360-m-0 c360-text-muted">
            geo_id {req.geoId ?? "—"} · max_jobs {req.maxJobs ?? "—"}
            {req.rescheduleAfterHours != null &&
            req.rescheduleAfterHours > 0 ? (
              <>
                {" "}
                · repeat every{" "}
                <Badge color="info" size="sm" className="c360-align-middle">
                  {req.rescheduleAfterHours}h
                </Badge>
              </>
            ) : null}
          </p>
          {runIdVal ? (
            <Tooltip content={runIdVal} placement="top">
              <p className="c360-m-0 c360-font-mono c360-text-2xs">
                Run{" "}
                {runIdVal.length > 20 ? `${runIdVal.slice(0, 20)}…` : runIdVal}
              </p>
            </Tooltip>
          ) : null}
        </div>

        <Progress
          value={progressValue}
          max={maxGoal}
          size="sm"
          color={progressColor}
          label="Jobs collected"
          showValue
        />

        {err ? (
          <Alert variant="danger" title="Error" className="c360-text-2xs">
            {err}
          </Alert>
        ) : null}

        <div className="c360-hs-scrape-session-card__actions c360-mt-auto c360-flex c360-flex-wrap c360-items-center c360-justify-end c360-gap-1">
          {runIdVal ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDrillSignals(runIdVal)}
            >
              Signals
            </Button>
          ) : null}
          {showManageActions && runIdVal ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={runActionId === runIdVal}
              onClick={() => void onRefresh(runIdVal)}
              leftIcon={
                <RefreshCw
                  size={14}
                  className={runActionId === runIdVal ? "c360-spin" : undefined}
                />
              }
            >
              {runActionId === runIdVal ? "Refresh…" : "Refresh"}
            </Button>
          ) : null}
          {canPause ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pauseRunId === runIdVal}
              leftIcon={<Pause size={14} />}
              onClick={() => void onPause(runIdVal)}
            >
              {pauseRunId === runIdVal ? "Pausing…" : "Pause"}
            </Button>
          ) : null}
          {canResume ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={resumeRunId === runIdVal}
              leftIcon={<Play size={14} />}
              onClick={() => void onResume(runIdVal)}
            >
              {resumeRunId === runIdVal ? "Resuming…" : "Resume"}
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={cancelRunId === runIdVal}
              leftIcon={<Ban size={14} />}
              onClick={() => setConfirmCancelOpen(true)}
            >
              Cancel
            </Button>
          ) : null}
          {id && runIdVal ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={scrapeDownloadId === id}
              onClick={() => void onDownloadCsv(id)}
            >
              {scrapeDownloadId === id ? "CSV…" : "CSV"}
            </Button>
          ) : null}
        </div>
      </Card>

      <ConfirmModal
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        title="Cancel this scrape?"
        message="The scraper satellite will stop this job. You can start a new scrape later."
        variant="warning"
        confirmLabel="Cancel run"
        processing={cancelRunId === runIdVal}
        onConfirm={async () => {
          if (!runIdVal) return;
          await onCancel(runIdVal);
          setConfirmCancelOpen(false);
        }}
      />
    </>
  );
}

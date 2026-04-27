"use client";

import { Fragment, useMemo, useState, useCallback } from "react";
import {
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Loader2,
  Download,
} from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import type { MappedJob } from "@/lib/jobs/jobsMapper";
import {
  formatJobIdShort,
  isSuccessfulTerminalJobStatus,
  canDownloadSchedulerOutput,
  schedulerOutputDownloadLabel,
} from "@/lib/jobs/jobsUtils";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

function hashJobRef(jobId: string): string {
  let h = 0;
  for (let i = 0; i < jobId.length; i++)
    h = (Math.imul(31, h) + jobId.charCodeAt(i)) | 0;
  const n = (Math.abs(h) % 90000) + 10000;
  return `#J-${n}`;
}

function formatCheckInDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

function serviceLabel(s: string): string {
  if (s === "email_server") return "Email";
  if (s === "sync_server") return "Sync";
  return s || "—";
}

function categoryLabel(job: MappedJob): string {
  return job.jobSubtype || job.jobFamily || "—";
}

type SortKey = "created" | "type" | "status" | "progress";
type SortDir = "asc" | "desc";

function SortCaret({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className="c360-jobs-dt__sort-carets" aria-hidden>
      <span
        className={cn(
          "c360-jobs-dt__sort-caret",
          active && dir === "asc" && "c360-jobs-dt__sort-caret--on",
        )}
      >
        ▲
      </span>
      <span
        className={cn(
          "c360-jobs-dt__sort-caret",
          active && dir === "desc" && "c360-jobs-dt__sort-caret--on",
        )}
      >
        ▼
      </span>
    </span>
  );
}

type StatusTone = "danger" | "warning" | "success" | "primary" | "muted";

function statusTone(status: string): StatusTone {
  const s = status.toUpperCase();
  if (s === "FAILED" || s === "CANCELLED") return "danger";
  if (s === "RUNNING" || s === "PAUSED" || s === "PENDING" || s === "OPEN") {
    if (s === "RUNNING") return "primary";
    return "warning";
  }
  if (isSuccessfulTerminalJobStatus(status)) return "success";
  return "muted";
}

function progressBarClass(tone: StatusTone): string {
  switch (tone) {
    case "success":
      return "c360-jobs-dt__progress-fill--success";
    case "danger":
      return "c360-jobs-dt__progress-fill--danger";
    case "warning":
      return "c360-jobs-dt__progress-fill--warning";
    case "primary":
      return "c360-jobs-dt__progress-fill--primary";
    default:
      return "c360-jobs-dt__progress-fill--muted";
  }
}

function progressTrackClass(tone: StatusTone): string {
  switch (tone) {
    case "success":
      return "c360-jobs-dt__progress-track--success";
    case "danger":
      return "c360-jobs-dt__progress-track--danger";
    case "warning":
      return "c360-jobs-dt__progress-track--warning";
    case "primary":
      return "c360-jobs-dt__progress-track--primary";
    default:
      return "c360-jobs-dt__progress-track--muted";
  }
}

export interface JobsDataTableProps {
  jobs: MappedJob[];
  loading?: boolean;
  expandedJobId: string | null;
  onToggleExpand: (jobId: string) => void;
  retryingJobId: string | null;
  onRetry: (jobId: string) => void | Promise<void>;
  onPause: (jobId: string) => void;
  onPauseConnectra: (jobId: string) => void;
  onCancel: (jobId: string) => void;
  onTerminateConnectra: (jobId: string) => void;
  onResume: (jobId: string) => void;
  onResumeConnectra: (jobId: string) => void;
  /** Raw S3 object key or HTTPS URL; parent may presign keys via GraphQL. */
  onDownloadOutput: (job: MappedJob) => void | Promise<void>;
  /** Opens global review drawer with this scheduler job prefilled. */
  onOpenJobTicket?: (job: MappedJob) => void;
  renderDetailPanel: (jobId: string) => React.ReactNode;
}

export function JobsDataTable({
  jobs,
  loading,
  expandedJobId,
  onToggleExpand,
  retryingJobId,
  onRetry,
  onPause,
  onPauseConnectra,
  onCancel,
  onTerminateConnectra,
  onResume,
  onResumeConnectra,
  onDownloadOutput,
  onOpenJobTicket,
  renderDetailPanel,
}: JobsDataTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.jobId.toLowerCase().includes(q) ||
        j.typeLabel.toLowerCase().includes(q) ||
        j.status.toLowerCase().includes(q) ||
        (j.sourceService || "").toLowerCase().includes(q) ||
        (j.jobFamily || "").toLowerCase().includes(q),
    );
  }, [jobs, search]);

  const sorted = useMemo(() => {
    const mul = sortDir === "asc" ? 1 : -1;
    const out = [...filtered];
    out.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "created":
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "type":
          cmp = a.typeLabel.localeCompare(b.typeLabel);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "progress":
          cmp = a.progress - b.progress;
          break;
        default:
          break;
      }
      return cmp * mul;
    });
    return out;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir(key === "created" ? "desc" : "asc");
      return key;
    });
  }, []);

  const toggleSelectAllPage = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (checked) {
          pageRows.forEach((j) => next.add(j.jobId));
        } else {
          pageRows.forEach((j) => next.delete(j.jobId));
        }
        return next;
      });
    },
    [pageRows],
  );

  const toggleRow = useCallback((jobId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(jobId);
      else next.delete(jobId);
      return next;
    });
  }, []);

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((j) => selected.has(j.jobId));
  const somePageSelected = pageRows.some((j) => selected.has(j.jobId));

  return (
    <div className="c360-jobs-dt">
      <div className="c360-jobs-dt__toolbar">
        <div className="c360-jobs-dt__toolbar-left">
          <span className="c360-jobs-dt__toolbar-label">Show</span>
          <Select
            options={PAGE_SIZE_OPTIONS}
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value) || 10);
              setPage(0);
            }}
            fullWidth={false}
            className="c360-jobs-dt__page-size"
          />
          <span className="c360-jobs-dt__toolbar-label">entries</span>
        </div>
        <div className="c360-jobs-dt__toolbar-right">
          <span className="c360-jobs-dt__toolbar-label">Search:</span>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Filter jobs…"
            className="c360-jobs-dt__search"
          />
        </div>
      </div>

      <div className="c360-jobs-dt__scroll">
        <table className="c360-jobs-dt__table">
          <thead>
            <tr>
              <th className="c360-jobs-dt__th--checkbox">
                <Checkbox
                  size="sm"
                  checked={allPageSelected}
                  indeterminate={!allPageSelected && somePageSelected}
                  onChange={(c) => toggleSelectAllPage(c)}
                  aria-label="Select all on this page"
                />
              </th>
              <th className="c360-jobs-dt__th--narrow" aria-hidden />
              <th>Job ref</th>
              <th>
                <button
                  type="button"
                  className="c360-jobs-dt__th-btn"
                  onClick={() => toggleSort("created")}
                >
                  Started
                  <SortCaret active={sortKey === "created"} dir={sortDir} />
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="c360-jobs-dt__th-btn"
                  onClick={() => toggleSort("type")}
                >
                  Task
                  <SortCaret active={sortKey === "type"} dir={sortDir} />
                </button>
              </th>
              <th>Service</th>
              <th>Category</th>
              <th>
                <button
                  type="button"
                  className="c360-jobs-dt__th-btn"
                  onClick={() => toggleSort("progress")}
                >
                  Progress
                  <SortCaret active={sortKey === "progress"} dir={sortDir} />
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="c360-jobs-dt__th-btn"
                  onClick={() => toggleSort("status")}
                >
                  Status
                  <SortCaret active={sortKey === "status"} dir={sortDir} />
                </button>
              </th>
              <th>Job ID</th>
              <th className="c360-jobs-dt__th--action">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && jobs.length === 0 ? (
              <tr>
                <td colSpan={11} className="c360-jobs-dt__loading">
                  <Loader2 size={20} className="c360-spin" />
                  <span>Loading jobs…</span>
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={11} className="c360-jobs-dt__empty">
                  No jobs match your filters.
                </td>
              </tr>
            ) : (
              pageRows.map((job, rowIndex) => {
                const expanded = expandedJobId === job.jobId;
                const tone = statusTone(job.status);
                const pct = Math.min(100, Math.max(0, job.progress));
                const pctLabel = `${Math.round(pct)}%`;
                return (
                  <Fragment key={job.jobId}>
                    <tr
                      className={cn(
                        "c360-jobs-dt__row",
                        rowIndex % 2 === 1 && "c360-jobs-dt__row--alt",
                        expanded && "c360-jobs-dt__row--expanded",
                      )}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          size="sm"
                          checked={selected.has(job.jobId)}
                          onChange={(c) => toggleRow(job.jobId, c)}
                          aria-label={`Select job ${job.jobId}`}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="c360-jobs-dt__expand"
                          aria-expanded={expanded ? "true" : "false"}
                          aria-label={
                            expanded
                              ? "Collapse job details"
                              : "Expand job details"
                          }
                          onClick={() => onToggleExpand(job.jobId)}
                        >
                          {expanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                      </td>
                      <td>
                        <strong className="c360-jobs-dt__job-ref">
                          {hashJobRef(job.jobId)}
                        </strong>
                      </td>
                      <td className="c360-jobs-dt__muted">
                        {formatCheckInDate(job.createdAt)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="c360-jobs-dt__task-link"
                          onClick={() => onToggleExpand(job.jobId)}
                        >
                          {job.typeLabel}
                        </button>
                      </td>
                      <td className="c360-jobs-dt__muted">
                        {serviceLabel(job.sourceService)}
                      </td>
                      <td className="c360-jobs-dt__muted">
                        {categoryLabel(job)}
                      </td>
                      <td>
                        <div
                          className={cn(
                            "c360-jobs-dt__progress-track",
                            progressTrackClass(tone),
                          )}
                        >
                          <div
                            className={cn(
                              "c360-jobs-dt__progress-fill",
                              progressBarClass(tone),
                            )}
                            style={{ width: `${pct}%` }}
                            role="progressbar"
                            aria-valuenow={Math.round(pct)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Progress ${Math.round(pct)} percent`}
                          />
                        </div>
                        <span className="c360-jobs-dt__progress-meta">
                          {job.total > 0
                            ? `${job.processed} / ${job.total}`
                            : job.jobFamily}
                        </span>
                      </td>
                      <td>
                        <div className="c360-jobs-dt__status-wrap">
                          <span
                            className={cn(
                              "c360-jobs-dt__pill",
                              `c360-jobs-dt__pill--${tone}`,
                            )}
                          >
                            <span
                              className="c360-jobs-dt__pill-dot"
                              aria-hidden
                            />
                            {job.status}
                          </span>
                          <span
                            className={cn(
                              "c360-jobs-dt__label-badge",
                              `c360-jobs-dt__label-badge--${tone}`,
                            )}
                          >
                            {pctLabel}
                          </span>
                        </div>
                      </td>
                      <td
                        className="c360-jobs-dt__mono c360-text-xs"
                        title={job.jobId}
                      >
                        {formatJobIdShort(job.jobId)}
                      </td>
                      <td className="c360-jobs-dt__action-cell">
                        <div className="c360-flex c360-items-center c360-justify-end c360-gap-1 c360-flex-wrap">
                          {canDownloadSchedulerOutput(job) && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              className="c360-whitespace-nowrap"
                              leftIcon={<Download size={14} />}
                              aria-label={`${schedulerOutputDownloadLabel(job)} via presigned URL`}
                              title="Presigned download for job output"
                              onClick={() => void onDownloadOutput(job)}
                            >
                              {schedulerOutputDownloadLabel(job)}
                            </Button>
                          )}
                          <Popover
                            align="end"
                            width={220}
                            trigger={
                              <button
                                type="button"
                                className="c360-jobs-dt__action-btn"
                                aria-label={`Actions for ${job.typeLabel}`}
                              >
                                <MoreHorizontal size={20} />
                              </button>
                            }
                            content={
                              <div className="c360-jobs-dt__menu">
                                {canDownloadSchedulerOutput(job) && (
                                  <button
                                    type="button"
                                    className="c360-jobs-dt__menu-item c360-jobs-dt__menu-item--primary"
                                    onClick={() => void onDownloadOutput(job)}
                                  >
                                    {schedulerOutputDownloadLabel(job)}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="c360-jobs-dt__menu-item"
                                  onClick={() => onToggleExpand(job.jobId)}
                                >
                                  {expanded ? "Hide details" : "View details"}
                                </button>
                                {onOpenJobTicket && (
                                  <button
                                    type="button"
                                    className="c360-jobs-dt__menu-item"
                                    onClick={() => onOpenJobTicket(job)}
                                  >
                                    Report issue (ticket)
                                  </button>
                                )}
                                {job.canPause && (
                                  <button
                                    type="button"
                                    className="c360-jobs-dt__menu-item"
                                    onClick={() => onPause(job.jobId)}
                                  >
                                    Pause
                                  </button>
                                )}
                                {job.canPauseConnectra && (
                                  <button
                                    type="button"
                                    className="c360-jobs-dt__menu-item"
                                    onClick={() => onPauseConnectra(job.jobId)}
                                  >
                                    Pause (sync)
                                  </button>
                                )}
                                {job.status === "PAUSED" &&
                                  job.sourceService === "email_server" && (
                                    <button
                                      type="button"
                                      className="c360-jobs-dt__menu-item"
                                      onClick={() => onResume(job.jobId)}
                                    >
                                      Resume
                                    </button>
                                  )}
                                {job.canResumeConnectra && (
                                  <button
                                    type="button"
                                    className="c360-jobs-dt__menu-item"
                                    onClick={() => onResumeConnectra(job.jobId)}
                                  >
                                    Resume (sync)
                                  </button>
                                )}
                                {job.canCancel && (
                                  <button
                                    type="button"
                                    className="c360-jobs-dt__menu-item c360-jobs-dt__menu-item--danger"
                                    onClick={() => onCancel(job.jobId)}
                                  >
                                    Cancel
                                  </button>
                                )}
                                {job.canTerminateConnectra && (
                                  <button
                                    type="button"
                                    className="c360-jobs-dt__menu-item c360-jobs-dt__menu-item--danger"
                                    onClick={() =>
                                      onTerminateConnectra(job.jobId)
                                    }
                                  >
                                    Terminate (sync)
                                  </button>
                                )}
                                {job.canRetry && (
                                  <button
                                    type="button"
                                    className="c360-jobs-dt__menu-item"
                                    disabled={retryingJobId === job.jobId}
                                    onClick={() => void onRetry(job.jobId)}
                                  >
                                    {retryingJobId === job.jobId
                                      ? "Retrying…"
                                      : "Retry"}
                                  </button>
                                )}
                              </div>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="c360-jobs-dt__detail-row">
                        <td colSpan={11} className="c360-jobs-dt__detail-cell">
                          {renderDetailPanel(job.jobId)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="c360-jobs-dt__footer">
        <p className="c360-jobs-dt__footer-text">
          Showing {sorted.length === 0 ? 0 : safePage * pageSize + 1} to{" "}
          {Math.min((safePage + 1) * pageSize, sorted.length)} of{" "}
          {sorted.length} entries
          {filtered.length !== jobs.length && (
            <span> (filtered from {jobs.length})</span>
          )}
        </p>
        <div className="c360-jobs-dt__pager">
          <Button
            variant="ghost"
            size="sm"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="c360-jobs-dt__footer-text">
            Page {safePage + 1} of {pageCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
